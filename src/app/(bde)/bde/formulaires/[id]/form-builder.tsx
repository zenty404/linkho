'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, AlignLeft, AlignJustify, Mail, Phone, Calendar, Hash,
  ToggleLeft, Disc, CheckSquare, ChevronDown, Paperclip, Minus,
  Copy, Trash2, Eye, Plus, X, Check, LoaderCircle,
} from 'lucide-react'
import { updateFormulaire, publierFormulaire, depublierFormulaire } from '@/lib/actions/formulaires'
import type { ChampFormulaire } from '@/lib/actions/formulaires'
import type { Database } from '@/lib/types/supabase'

type Formulaire = Database['public']['Tables']['formulaire_inscriptions']['Row']
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'
type Tab = 'editeur' | 'parametres' | 'reponses'

// ─── Constantes ───────────────────────────────────────────────────────────────

const FIELD_TYPES_STANDARD: { type: ChampFormulaire['type']; label: string; icon: React.ElementType }[] = [
  { type: 'text_court',  label: 'Texte court',   icon: AlignLeft },
  { type: 'text_long',   label: 'Texte long',    icon: AlignJustify },
  { type: 'email',       label: 'Email',          icon: Mail },
  { type: 'telephone',   label: 'Téléphone',      icon: Phone },
  { type: 'date',        label: 'Date',           icon: Calendar },
  { type: 'nombre',      label: 'Nombre',         icon: Hash },
  { type: 'oui_non',     label: 'Oui / Non',      icon: ToggleLeft },
]

const FIELD_TYPES_AVANCE: { type: ChampFormulaire['type']; label: string; icon: React.ElementType }[] = [
  { type: 'selection_unique',   label: 'Sélection unique',   icon: Disc },
  { type: 'selection_multiple', label: 'Sélection multiple', icon: CheckSquare },
  { type: 'liste_deroulante',   label: 'Liste déroulante',   icon: ChevronDown },
  { type: 'fichier',            label: 'Fichier',            icon: Paperclip },
  { type: 'separateur',         label: 'Séparateur',         icon: Minus },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  [...FIELD_TYPES_STANDARD, ...FIELD_TYPES_AVANCE].map(({ type, label }) => [type, label]),
)

const HAS_OPTIONS = new Set(['selection_unique', 'selection_multiple', 'liste_deroulante'])
const HAS_PLACEHOLDER = new Set(['text_court', 'text_long', 'email', 'telephone', 'date', 'nombre', 'liste_deroulante'])

function makeChamp(type: ChampFormulaire['type'], ordre: number): ChampFormulaire {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    libelle: TYPE_LABELS[type] ?? type,
    obligatoire: false,
    ordre,
    options: HAS_OPTIONS.has(type) ? ['Option 1', 'Option 2'] : undefined,
  }
}

// ─── ChampPreview ─────────────────────────────────────────────────────────────

function ChampPreview({ champ }: { champ: ChampFormulaire }) {
  const base = 'bg-gray-50 border border-gray-200 rounded-lg px-3 py-2'
  const placeholder = <p className="text-xs text-gray-400">{champ.placeholder || 'Votre réponse…'}</p>

  switch (champ.type) {
    case 'separateur':
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">{champ.libelle || 'Section'}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )
    case 'text_long':
      return <div className={`${base} h-12`}>{placeholder}</div>
    case 'oui_non':
      return (
        <div className="flex gap-2">
          <div className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-400">Oui</div>
          <div className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-400">Non</div>
        </div>
      )
    case 'selection_unique':
      return (
        <div className="space-y-1">
          {(champ.options ?? ['Option 1', 'Option 2']).slice(0, 3).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
              <span className="text-xs text-gray-500">{o}</span>
            </div>
          ))}
        </div>
      )
    case 'selection_multiple':
      return (
        <div className="space-y-1">
          {(champ.options ?? ['Option 1', 'Option 2']).slice(0, 3).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded border border-gray-300 shrink-0" />
              <span className="text-xs text-gray-500">{o}</span>
            </div>
          ))}
        </div>
      )
    case 'liste_deroulante':
      return (
        <div className={`${base} flex items-center justify-between`}>
          <span className="text-xs text-gray-400">Sélectionner…</span>
          <ChevronDown size={12} className="text-gray-400" />
        </div>
      )
    case 'fichier':
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg py-3 text-center">
          <Paperclip size={14} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-400">Cliquer ou glisser-déposer</p>
        </div>
      )
    default:
      return <div className={base}>{placeholder}</div>
  }
}

// ─── SortableChamp ────────────────────────────────────────────────────────────

type SortableChampProps = {
  champ: ChampFormulaire
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onCopy: () => void
}

function SortableChamp({ champ, isSelected, onSelect, onDelete, onCopy }: SortableChampProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: champ.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={`bg-white rounded-xl border-2 cursor-pointer transition-all select-none ${
        isDragging
          ? 'opacity-40 border-brand border-dashed shadow-lg'
          : isSelected
          ? 'border-brand shadow-sm'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {champ.type !== 'separateur' && (
        <div className="px-4 pt-3 pb-1 flex items-start gap-2">
          <button
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none mt-0.5 shrink-0"
          >
            <GripVertical size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-navy truncate">
                {champ.libelle}
                {champ.obligatoire && <span className="text-red-400 ml-0.5">*</span>}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {TYPE_LABELS[champ.type]}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCopy() }}
                  className="p-0.5 text-gray-400 hover:text-navy transition-colors"
                  title="Dupliquer"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <ChampPreview champ={champ} />
            {champ.aide && (
              <p className="text-xs text-gray-400 mt-1.5">{champ.aide}</p>
            )}
          </div>
        </div>
      )}

      {champ.type === 'separateur' && (
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
          >
            <GripVertical size={14} />
          </button>
          <div className="flex-1">
            <ChampPreview champ={champ} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onCopy() }} className="p-0.5 text-gray-400 hover:text-navy"><Copy size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-0.5 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FieldTypePanel ───────────────────────────────────────────────────────────

function FieldTypePanel({ onAdd }: { onAdd: (type: ChampFormulaire['type']) => void }) {
  return (
    <div className="w-[200px] shrink-0 bg-white rounded-xl border border-gray-200 sticky top-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 pt-2 pb-1.5">
          Champs standards
        </p>
        {FIELD_TYPES_STANDARD.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-navy transition-colors text-left group"
          >
            <Icon size={14} className="text-gray-400 group-hover:text-brand shrink-0" />
            <span>{label}</span>
          </button>
        ))}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 pt-4 pb-1.5">
          Champs avancés
        </p>
        {FIELD_TYPES_AVANCE.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-navy transition-colors text-left group"
          >
            <Icon size={14} className="text-gray-400 group-hover:text-brand shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── PropertiesPanel ──────────────────────────────────────────────────────────

function PropertiesPanel({
  champ,
  onChange,
}: {
  champ: ChampFormulaire | null
  onChange: (updates: Partial<ChampFormulaire>) => void
}) {
  if (!champ) {
    return (
      <div className="w-[280px] shrink-0 bg-white rounded-xl border border-gray-200 sticky top-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Propriétés</p>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <AlignLeft size={18} className="text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sélectionnez un champ pour modifier ses propriétés
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isSep = champ.type === 'separateur'
  const hasOpts = HAS_OPTIONS.has(champ.type)
  const hasPhd = HAS_PLACEHOLDER.has(champ.type)
  const hasVal = champ.type === 'nombre'

  return (
    <div className="w-[280px] shrink-0 bg-white rounded-xl border border-gray-200 sticky top-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Propriétés</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{TYPE_LABELS[champ.type]}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Libellé */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1.5">
            {isSep ? 'Titre de section' : 'Libellé'} *
          </label>
          <input
            value={champ.libelle}
            onChange={(e) => onChange({ libelle: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder={isSep ? 'Titre de section' : 'Label du champ'}
          />
        </div>

        {/* Obligatoire */}
        {!isSep && (
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs font-medium text-gray-700">Champ obligatoire</span>
            <button
              type="button"
              onClick={() => onChange({ obligatoire: !champ.obligatoire })}
              className={`relative w-9 h-5 rounded-full transition-colors ${champ.obligatoire ? 'bg-brand' : 'bg-gray-200'}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  champ.obligatoire ? 'left-0.5 translate-x-4' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        )}

        {/* Placeholder */}
        {hasPhd && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Placeholder</label>
            <input
              value={champ.placeholder ?? ''}
              onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Exemple de saisie…"
            />
          </div>
        )}

        {/* Options */}
        {hasOpts && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Options</label>
            <div className="space-y-1.5">
              {(champ.options ?? []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    value={opt}
                    onChange={(e) => {
                      const opts = [...(champ.options ?? [])]
                      opts[idx] = e.target.value
                      onChange({ options: opts })
                    }}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ options: (champ.options ?? []).filter((_, i) => i !== idx) })}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ options: [...(champ.options ?? []), `Option ${(champ.options?.length ?? 0) + 1}`] })}
                className="flex items-center gap-1 text-xs text-brand hover:text-brand-light font-medium transition-colors mt-1"
              >
                <Plus size={12} /> Ajouter une option
              </button>
            </div>
          </div>
        )}

        {/* Validation (nombre) */}
        {hasVal && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Validation</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Minimum</label>
                <input
                  type="number"
                  value={champ.validation?.min ?? ''}
                  onChange={(e) =>
                    onChange({ validation: { ...champ.validation, min: e.target.value ? Number(e.target.value) : undefined } })
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Maximum</label>
                <input
                  type="number"
                  value={champ.validation?.max ?? ''}
                  onChange={(e) =>
                    onChange({ validation: { ...champ.validation, max: e.target.value ? Number(e.target.value) : undefined } })
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        )}

        {/* Texte d'aide */}
        {!isSep && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Texte d&apos;aide</label>
            <input
              value={champ.aide ?? ''}
              onChange={(e) => onChange({ aide: e.target.value || undefined })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Indication supplémentaire…"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FormBuilder (main) ───────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  editeur: 'Éditeur',
  parametres: 'Paramètres',
  reponses: 'Réponses',
}

export function FormBuilder({ formulaire }: { formulaire: Formulaire }) {
  const [champs, setChamps] = useState<ChampFormulaire[]>(
    (formulaire.champs as unknown as ChampFormulaire[]) ?? [],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [titre, setTitre] = useState(formulaire.titre)
  const [description, setDescription] = useState(formulaire.description ?? '')
  const [prixTotal, setPrixTotal] = useState<number | ''>(formulaire.prix_total ?? '')
  const [publie, setPublie] = useState(formulaire.publie)
  const [activeTab, setActiveTab] = useState<Tab>('editeur')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isPending, startTransition] = useTransition()

  // Always-current ref for auto-save (avoids stale closures)
  const latestRef = useRef({ champs, titre, description, prixTotal })
  latestRef.current = { champs, titre, description, prixTotal }
  const isFirst = useRef(true)

  // Auto-save debounce
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    setSaveStatus('pending')
    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      const { champs, titre, description, prixTotal } = latestRef.current
      const res = await updateFormulaire(
        formulaire.id,
        champs,
        prixTotal === '' ? null : Number(prixTotal),
        titre,
        description || null,
      )
      setSaveStatus(res.error ? 'error' : 'saved')
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champs, titre, description, prixTotal])

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setChamps((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === String(active.id))
      const newIdx = prev.findIndex((c) => c.id === String(over.id))
      return arrayMove(prev, oldIdx, newIdx).map((c, i) => ({ ...c, ordre: i + 1 }))
    })
  }

  // Field operations
  const addChamp = (type: ChampFormulaire['type']) => {
    const c = makeChamp(type, champs.length + 1)
    setChamps((prev) => [...prev, c])
    setSelectedId(c.id)
  }

  const deleteChamp = (id: string) => {
    setChamps((prev) => prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, ordre: i + 1 })))
    if (selectedId === id) setSelectedId(null)
  }

  const copyChamp = (id: string) => {
    const orig = champs.find((c) => c.id === id)
    if (!orig) return
    const copy: ChampFormulaire = { ...orig, id: `field_${Date.now()}`, ordre: champs.length + 1 }
    setChamps((prev) => [...prev, copy])
    setSelectedId(copy.id)
  }

  const updateChamp = (id: string, updates: Partial<ChampFormulaire>) => {
    setChamps((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const selectedChamp = champs.find((c) => c.id === selectedId) ?? null

  // Publish
  const handlePublier = () => {
    startTransition(async () => {
      const res = await publierFormulaire(formulaire.id)
      if (!res.error) setPublie(true)
    })
  }

  const handleDepublier = () => {
    startTransition(async () => {
      const res = await depublierFormulaire(formulaire.id)
      if (!res.error) setPublie(false)
    })
  }

  return (
    <div className="-m-6 flex flex-col bg-gray-50" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 pt-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="flex-1 min-w-0 text-lg font-bold text-navy bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-brand focus:outline-none pb-0.5 transition-colors"
              placeholder="Titre du formulaire"
            />
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${
                publie
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
              }`}
            >
              {publie ? 'Publié' : 'Brouillon'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save status */}
            <span className="text-xs text-gray-400 flex items-center gap-1 min-w-[120px] justify-end">
              {saveStatus === 'saving' && (
                <><LoaderCircle size={11} className="animate-spin" /> Enregistrement…</>
              )}
              {saveStatus === 'saved' && (
                <><Check size={11} className="text-emerald-500" /> Enregistré</>
              )}
              {saveStatus === 'pending' && 'Modifications…'}
              {saveStatus === 'error' && <span className="text-red-500">Erreur de sauvegarde</span>}
            </span>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Fonctionnalité à venir"
            >
              <Eye size={13} /> Aperçu
            </button>

            {publie ? (
              <button
                type="button"
                onClick={handleDepublier}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Dépublier
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublier}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-bold text-white bg-navy hover:bg-navy-light rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Publication…' : 'Publier'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand text-navy'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'editeur' && (
        <div className="flex flex-1 gap-4 p-4 min-h-0 items-start">
          {/* Left panel */}
          <FieldTypePanel onAdd={addChamp} />

          {/* Center canvas */}
          <div className="flex-1 min-w-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={champs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {champs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl bg-white text-center px-6">
                      <p className="text-sm text-gray-400">
                        Cliquez sur un type de champ à gauche pour l&apos;ajouter
                      </p>
                    </div>
                  )}
                  {champs.map((champ) => (
                    <SortableChamp
                      key={champ.id}
                      champ={champ}
                      isSelected={selectedId === champ.id}
                      onSelect={() => setSelectedId(champ.id)}
                      onDelete={() => deleteChamp(champ.id)}
                      onCopy={() => copyChamp(champ.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Right panel */}
          <PropertiesPanel
            champ={selectedChamp}
            onChange={(updates) => selectedId && updateChamp(selectedId, updates)}
          />
        </div>
      )}

      {activeTab === 'parametres' && (
        <div className="flex-1 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Paramètres du formulaire
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Description publique du formulaire…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Prix total (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={prixTotal}
                  onChange={(e) => setPrixTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reponses' && (
        <div className="flex-1 p-4">
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {publie ? (
              <p className="text-sm text-gray-400">
                Les réponses apparaîtront ici une fois des inscriptions reçues.
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Publiez le formulaire pour commencer à recevoir des réponses.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

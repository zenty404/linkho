'use client'

import { useActionState, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { fr } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import {
  updateProfilEtablissement,
  updateTagsEquipements,
  updateTypesEvenements,
  getIndisponibilites,
  ajouterIndisponibilite,
  supprimerIndisponibilite,
  ajouterPhoto,
  supprimerPhoto,
  type Indisponibilite,
} from '@/lib/actions/parametres'
import { PARAM_INIT } from '@/lib/types/params'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/supabase'
import {
  SettingsShell,
  SectionCard,
  settingsInputCls,
  SettingsSaveButton,
  SettingsStateMessages,
  type SettingsTab,
} from '@/components/shared/settings-shell'
type EtabPhoto = Database['public']['Tables']['etablissement_photos']['Row']
type ReservationPeriode = Pick<
  Database['public']['Tables']['reservations']['Row'],
  'id' | 'date_debut' | 'date_fin'
>

type EtabProfile = Database['public']['Tables']['etablissement_profiles']['Row']

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPES_EVENEMENTS = [
  'WEI',
  'Soirée',
  'Gala',
  'Séminaire',
  'Week-end',
  "Journée d'intégration",
  'Autre',
]

const TAGS_EQUIPEMENTS = [
  'Piscine',
  'Scène',
  'Sono',
  'Parking',
  'Bar',
  'Cuisine',
  'Hébergement',
  'Salle de réception',
  'Terrasse',
  'Climatisation',
  'WiFi',
  'Jacuzzi',
  'Salle de sport',
  'Karaoké',
  'Barbecue',
]

const TYPES_LIEU = [
  { value: '', label: '— Sélectionner —' },
  { value: 'chateau', label: 'Château' },
  { value: 'domaine', label: 'Domaine' },
  { value: 'auberge', label: 'Auberge' },
  { value: 'gite', label: 'Gîte' },
  { value: 'salle_fetes', label: 'Salle des fêtes' },
  { value: 'espace_seminaire', label: 'Espace de séminaire' },
  { value: 'autre', label: 'Autre' },
]

const inputCls = settingsInputCls

// ─── Icônes ───────────────────────────────────────────────────────────────────

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ICONS = {
  photos: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M8 5l1.5-2h5L16 5" />
    </svg>
  ),
  lieu: (
    <svg {...iconProps}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  disponibilites: (
    <svg {...iconProps}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3M16 3v3" />
    </svg>
  ),
  tarifs: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8.5h4.5a2 2 0 010 4H9m0 0h5m-5 0v3.5m0-7V7" />
    </svg>
  ),
  localisation: (
    <svg {...iconProps}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 105 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  banque: (
    <svg {...iconProps}>
      <path d="M3 10l9-6 9 6" />
      <path d="M4.5 10v9M9.5 10v9M14.5 10v9M19.5 10v9" />
      <path d="M3 19h18" />
    </svg>
  ),
  caution: (
    <svg {...iconProps}>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" />
    </svg>
  ),
  legal: (
    <svg {...iconProps}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  ),
  compte: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
}

const TABS: SettingsTab[] = [
  { id: 'photos', label: 'Photos', icon: ICONS.photos },
  { id: 'lieu', label: 'Mon lieu', icon: ICONS.lieu },
  { id: 'disponibilites', label: 'Disponibilités', icon: ICONS.disponibilites },
  { id: 'tarifs', label: 'Tarifs & capacités', icon: ICONS.tarifs },
  { id: 'localisation', label: 'Localisation', icon: ICONS.localisation },
  { id: 'banque', label: 'Coordonnées bancaires', icon: ICONS.banque },
  { id: 'caution', label: 'Caution', icon: ICONS.caution },
  { id: 'legal', label: 'Informations légales', icon: ICONS.legal },
  { id: 'compte', label: 'Compte', icon: ICONS.compte },
]

// ─── Primitives partagés ──────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | number | null
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className={inputCls}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const StateMessages = SettingsStateMessages
const SaveButton = SettingsSaveButton

// ─── Section Photos ───────────────────────────────────────────────────────────

function PhotosSection({
  etablissementId,
  initialPhotos,
}: {
  etablissementId: string | null
  initialPhotos: EtabPhoto[]
}) {
  const [photos, setPhotos] = useState<EtabPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    if (!etablissementId || files.length === 0) return
    setError(null)
    setUploading(true)

    const supabase = createClient()

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${etablissementId}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('etablissement-photos')
        .upload(path, file, { upsert: false })

      if (uploadErr) {
        setError(`Erreur upload ${file.name} : ${uploadErr.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('etablissement-photos')
        .getPublicUrl(path)

      const ordre = photos.length
      const result = await ajouterPhoto(publicUrl, ordre)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setPhotos((prev) => [...prev, result.data!])
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(photo: EtabPhoto) {
    const result = await supprimerPhoto(photo.id, photo.url)
    if (result.error) {
      setError(result.error)
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    }
  }

  return (
    <SectionCard title="Photos" subtitle="La première photo ajoutée sera votre photo principale.">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Grille des photos existantes */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-brand text-white text-[10px] font-semibold rounded-md">
                    Principale
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Zone d'upload */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-2 text-gray-300"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <p className="text-sm text-gray-400">
            {uploading
              ? 'Upload en cours…'
              : photos.length === 0
                ? 'Cliquez pour ajouter des photos'
                : 'Ajouter d\'autres photos'}
          </p>
          <p className="text-xs text-gray-300 mt-1">JPG, PNG, WebP — max 5 Mo par fichier</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </SectionCard>
  )
}

// ─── Section Types d'événements ──────────────────────────────────────────────

function TypesEvenementsSection({ initialTypes }: { initialTypes: string[] }) {
  const [types, setTypes] = useState<string[]>(initialTypes)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<{ success: boolean; error: string | null }>({
    success: false,
    error: null,
  })

  function toggleType(type: string) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  async function handleSave() {
    setSaving(true)
    setState({ success: false, error: null })
    const result = await updateTypesEvenements(types)
    setSaving(false)
    if (result.error) setState({ success: false, error: result.error })
    else setState({ success: true, error: null })
  }

  return (
    <SectionCard title="Types d'événements acceptés">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          {TYPES_EVENEMENTS.map((type) => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={types.includes(type)}
                onChange={() => toggleType(type)}
                className="w-4 h-4 rounded accent-brand"
              />
              <span className="text-sm text-navy/80">{type}</span>
            </label>
          ))}
        </div>

        <StateMessages success={state.success} error={state.error} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Section Équipements ──────────────────────────────────────────────────────

function EquipementsSection({ initialTags }: { initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<{ success: boolean; error: string | null }>({
    success: false,
    error: null,
  })

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSave() {
    setSaving(true)
    setState({ success: false, error: null })
    const result = await updateTagsEquipements(tags)
    setSaving(false)
    if (result.error) setState({ success: false, error: result.error })
    else setState({ success: true, error: null })
  }

  return (
    <SectionCard title="Équipements">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TAGS_EQUIPEMENTS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                tags.includes(tag)
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <StateMessages success={state.success} error={state.error} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── Section Disponibilités ───────────────────────────────────────────────────

function DisponibilitesSection({
  initialIndispos,
  reservations,
}: {
  initialIndispos: Indisponibilite[]
  reservations: ReservationPeriode[]
}) {
  const [indispos, setIndispos] = useState<Indisponibilite[]>(initialIndispos)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function fmtDateCourt(s: string): string {
    const parts = s.split('-')
    return `${parts[2]}/${parts[1]}`
  }

  const periodesBloquees = useMemo<DateRange[]>(
    () => indispos.map((i) => ({ from: parseISO(i.date_debut), to: parseISO(i.date_fin) })),
    [indispos],
  )

  const periodesReservees = useMemo<DateRange[]>(
    () => reservations.map((r) => ({ from: parseISO(r.date_debut), to: parseISO(r.date_fin) })),
    [reservations],
  )

  async function handleAjouter() {
    if (!range?.from || !range?.to) {
      setError('Veuillez sélectionner une période sur le calendrier.')
      return
    }
    setSaving(true)
    setError(null)
    const dateDebut = format(range.from, 'yyyy-MM-dd')
    const dateFin = format(range.to, 'yyyy-MM-dd')
    const result = await ajouterIndisponibilite(dateDebut, dateFin, motif || undefined)
    if (result.error) {
      setSaving(false)
      setError(result.error)
      return
    }
    const refreshed = await getIndisponibilites()
    setSaving(false)
    if (refreshed.data) setIndispos(refreshed.data)
    setRange(undefined)
    setMotif('')
  }

  async function handleSupprimer(id: string) {
    setDeletingId(id)
    const result = await supprimerIndisponibilite(id)
    setDeletingId(null)
    if (result.error) {
      setError(result.error)
    } else {
      setIndispos((prev) => prev.filter((i) => i.id !== id))
    }
  }

  return (
    <SectionCard title="Disponibilités" subtitle="Bloquez des périodes où votre lieu n'est pas disponible.">
      <div className="space-y-5">
        <div className="space-y-3">
          <input type="hidden" name="date_debut" value={range?.from ? format(range.from, 'yyyy-MM-dd') : ''} />
          <input type="hidden" name="date_fin" value={range?.to ? format(range.to, 'yyyy-MM-dd') : ''} />

          <div className="flex justify-center w-full overflow-x-auto">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={fr}
              numberOfMonths={2}
              disabled={[...periodesBloquees, { before: new Date() }]}
              modifiers={{
                bloquee: periodesBloquees,
                reservation: periodesReservees,
              }}
              modifiersClassNames={{
                bloquee: 'rdp-day_bloquee',
                reservation: 'rdp-day_reservation',
              }}
              className="border border-gray-100 rounded-2xl p-6 bg-white w-full"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#fee2e2]" /> Période bloquée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#dbeafe]" /> Réservation confirmée
            </span>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Motif <span className="text-gray-300">(optionnel)</span>
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Réservation privée, Fermeture annuelle…"
              className={inputCls}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleAjouter}
            disabled={saving || !range?.from || !range?.to}
            className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Bloquer ces dates'}
          </button>
        </div>

        {indispos.length > 0 ? (
          <div className="border-t border-gray-100 pt-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Périodes bloquées
            </p>
            {indispos.map((indispo) => (
              <div
                key={indispo.id}
                className="flex items-center justify-between gap-3 py-2.5 px-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-navy">
                  Du {fmtDateCourt(indispo.date_debut)} au {fmtDateCourt(indispo.date_fin)}
                  {indispo.motif && (
                    <span className="text-gray-400 ml-1">— {indispo.motif}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleSupprimer(indispo.id)}
                  disabled={deletingId === indispo.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 disabled:opacity-50"
                >
                  {deletingId === indispo.id ? '…' : 'Supprimer'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune période bloquée manuellement.</p>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Toggle visibilité ────────────────────────────────────────────────────────

function VisibleToggle({
  name,
  defaultChecked,
}: {
  name: string
  defaultChecked: boolean
}) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-navy">Visible sur le catalogue</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Votre lieu apparaît dans les recherches des BDE
        </p>
      </div>
      <input type="hidden" name={name} value={String(on)} />
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          on ? 'bg-brand' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={on}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  etab: EtabProfile | null
  email: string
  etablissementId: string | null
  photos: EtabPhoto[]
  indisponibilites: Indisponibilite[]
  reservations: ReservationPeriode[]
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function EtabParamsForm({ etab, email, etablissementId, photos, indisponibilites, reservations }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('photos')
  const [infosState, infosAction, infosPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [typeState, typeAction, typePending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [capState, capAction, capPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [locState, locAction, locPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [bancState, bancAction, bancPending] = useActionState(updateProfilEtablissement, PARAM_INIT)
  const [cautionState, cautionAction, cautionPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [legalState, legalAction, legalPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )

  useEffect(() => {
    if (cautionState?.success) {
      router.refresh()
    }
  }, [cautionState?.success])

  return (
    <SettingsShell
      title="Paramètres"
      subtitle="Gérez votre fiche et votre compte"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Photos */}
      {activeTab === 'photos' && (
        <PhotosSection etablissementId={etablissementId} initialPhotos={photos} />
      )}

      {/* Mon lieu : infos + type/visibilité + équipements + types d'événements */}
      {activeTab === 'lieu' && (
        <>
          <SectionCard title="Informations du lieu" subtitle="Les informations générales affichées sur votre fiche">
            <form action={infosAction} className="space-y-4">
              <Field
                label="Nom du lieu"
                name="nom"
                required
                defaultValue={etab?.nom}
                placeholder="Château de la Loire"
              />
              <div>
                <label htmlFor="description" className="block text-xs text-gray-500 mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={etab?.description ?? ''}
                  placeholder="Décrivez votre lieu…"
                  className={inputCls + ' resize-none'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Adresse" name="adresse" defaultValue={etab?.adresse} placeholder="12 rue des Vignes" />
                <Field label="Ville" name="ville" defaultValue={etab?.ville} placeholder="Bordeaux" />
                <Field label="Code postal" name="code_postal" defaultValue={etab?.code_postal} placeholder="33000" />
                <Field label="Téléphone" name="telephone" type="tel" defaultValue={etab?.telephone} placeholder="05 00 00 00 00" />
                <Field label="Email de contact" name="email_contact" type="email" defaultValue={etab?.email_contact} placeholder="contact@monlieu.fr" />
                <Field label="Site web" name="site_web" type="url" defaultValue={etab?.site_web} placeholder="https://monlieu.fr" />
              </div>
              <StateMessages success={infosState.success} error={infosState.error} />
              <div className="pt-1"><SaveButton pending={infosPending} /></div>
            </form>
          </SectionCard>

          <SectionCard title="Type et visibilité" subtitle="Le type de lieu et sa visibilité dans le catalogue">
            <form action={typeAction} className="space-y-5">
              <div>
                <label htmlFor="type_lieu" className="block text-xs text-gray-500 mb-1.5">
                  Type de lieu
                </label>
                <select
                  id="type_lieu"
                  name="type_lieu"
                  defaultValue={etab?.type_lieu ?? ''}
                  className={inputCls + ' cursor-pointer'}
                >
                  {TYPES_LIEU.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <VisibleToggle name="visible" defaultChecked={etab?.visible ?? true} />

              <StateMessages success={typeState.success} error={typeState.error} />
              <div className="pt-1"><SaveButton pending={typePending} /></div>
            </form>
          </SectionCard>

          <EquipementsSection initialTags={etab?.tags_equipements ?? []} />

          <TypesEvenementsSection initialTypes={etab?.types_evenements ?? []} />
        </>
      )}

      {/* Disponibilités */}
      {activeTab === 'disponibilites' && (
        <DisponibilitesSection initialIndispos={indisponibilites} reservations={reservations} />
      )}

      {/* Tarifs & capacités */}
      {activeTab === 'tarifs' && (
        <>
          <SectionCard title="Capacités et tarifs" subtitle="Les capacités d'accueil et le tarif de base de votre lieu">
            <form action={capAction} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Capacité max" name="capacite_max" type="number" defaultValue={etab?.capacite_max} placeholder="200" />
                <Field label="Nb couchages" name="nb_couchages" type="number" defaultValue={etab?.nb_couchages} placeholder="50" />
                <Field label="Nb chambres" name="nb_chambres" type="number" defaultValue={etab?.nb_chambres} placeholder="25" />
                <Field label="Nb salles de bain" name="nb_salles_de_bain" type="number" defaultValue={etab?.nb_salles_de_bain} placeholder="10" />
                <Field label="Superficie (m²)" name="superficie_m2" type="number" defaultValue={etab?.superficie_m2} placeholder="500" />
                <Field label="Prix de base (€)" name="prix_base" type="number" defaultValue={etab?.prix_base} placeholder="1500" hint="par nuit ou événement" />
              </div>
              <StateMessages success={capState.success} error={capState.error} />
              <div className="pt-1"><SaveButton pending={capPending} /></div>
            </form>
          </SectionCard>

          <SectionCard title="Taux de commission">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-navy tabular-nums">
                  {etab?.taux_commission ?? 12} %
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Ce taux est défini par l&apos;équipe LINKHO. Contactez-nous pour toute modification.
                </p>
              </div>
              <span className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
                Lecture seule
              </span>
            </div>
          </SectionCard>
        </>
      )}

      {/* Localisation */}
      {activeTab === 'localisation' && (
        <SectionCard title="Localisation" subtitle="Les coordonnées GPS de votre lieu">
          <form action={locAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" name="latitude" type="number" defaultValue={etab?.latitude} placeholder="44.837789" />
              <Field label="Longitude" name="longitude" type="number" defaultValue={etab?.longitude} placeholder="-0.579180" />
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors"
            >
              Trouver mes coordonnées sur Google Maps →
            </a>
            <StateMessages success={locState.success} error={locState.error} />
            <div className="pt-1"><SaveButton pending={locPending} /></div>
          </form>
        </SectionCard>
      )}

      {/* Coordonnées bancaires */}
      {activeTab === 'banque' && (
        <SectionCard title="Coordonnées bancaires" subtitle="Ces coordonnées seront affichées sur les factures envoyées aux BDE">
          <form action={bancAction} className="space-y-4">
            <Field
              label="Titulaire du compte"
              name="titulaire_compte"
              defaultValue={(etab as unknown as Record<string, string>)?.titulaire_compte}
              placeholder="SAS Château de la Loire"
            />
            <Field
              label="IBAN"
              name="iban"
              defaultValue={etab?.iban}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
            />
            <Field
              label="BIC / SWIFT"
              name="bic"
              defaultValue={(etab as unknown as Record<string, string>)?.bic}
              placeholder="XXXXXXXX"
            />
            <StateMessages success={bancState.success} error={bancState.error} />
            <div className="pt-1"><SaveButton pending={bancPending} /></div>
          </form>
        </SectionCard>
      )}

      {/* Caution */}
      {activeTab === 'caution' && (
        <SectionCard title="Caution" subtitle="Le montant de la caution solidaire demandée aux BDE">
          <form action={cautionAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                Caution (€)
              </label>
              <input
                name="caution_montant"
                type="number"
                min="0"
                step="100"
                defaultValue={etab?.caution_montant ?? ''}
                placeholder="ex: 4000"
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Montant total de la caution solidaire BDE. Les chèques seront automatiquement calculés par paliers (25%, 50%, 75%, 100% du montant).
              </p>
            </div>
            <StateMessages success={cautionState.success} error={cautionState.error} />
            <div className="pt-1"><SaveButton pending={cautionPending} /></div>
          </form>
        </SectionCard>
      )}

      {/* Informations légales */}
      {activeTab === 'legal' && (
        <SectionCard title="Informations légales" subtitle="Ces informations apparaissent sur les devis et factures">
          <form action={legalAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="SIRET"
                name="siret"
                defaultValue={(etab as unknown as Record<string, string>)?.siret}
                placeholder="12345678901234"
              />
              <Field
                label="Forme juridique"
                name="forme_juridique"
                defaultValue={(etab as unknown as Record<string, string>)?.forme_juridique}
                placeholder="SARL, SAS, Auto-entrepreneur…"
              />
              <Field
                label="Capital social"
                name="capital_social"
                defaultValue={(etab as unknown as Record<string, string>)?.capital_social}
                placeholder="10 000 €"
              />
              <Field
                label="N° TVA intracommunautaire"
                name="tva_intracommunautaire"
                defaultValue={(etab as unknown as Record<string, string>)?.tva_intracommunautaire}
                placeholder="FR12345678901"
              />
            </div>
            <div>
              <label htmlFor="conditions_paiement" className="block text-xs text-gray-500 mb-1.5">
                Conditions de paiement
              </label>
              <textarea
                id="conditions_paiement"
                name="conditions_paiement"
                rows={3}
                defaultValue={(etab as unknown as Record<string, string>)?.conditions_paiement ?? ''}
                placeholder="30% à la signature, 70% le jour J"
                className={inputCls + ' resize-none'}
              />
            </div>
            <Field
              label="Délai de validité du devis (jours)"
              name="delai_validite_devis"
              type="number"
              defaultValue={(etab as unknown as Record<string, number>)?.delai_validite_devis ?? 30}
              placeholder="30"
            />
            <StateMessages success={legalState.success} error={legalState.error} />
            <div className="pt-1"><SaveButton pending={legalPending} /></div>
          </form>
        </SectionCard>
      )}

      {/* Compte */}
      {activeTab === 'compte' && (
        <SectionCard title="Compte" subtitle="Les informations de connexion associées à votre espace">
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Email</p>
              <p className="text-sm font-medium text-navy">{email}</p>
              <p className="text-xs text-gray-400 mt-1">L&apos;email ne peut pas être modifié ici.</p>
            </div>
            <div className="pt-1 border-t border-gray-100">
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </SectionCard>
      )}
    </SettingsShell>
  )
}

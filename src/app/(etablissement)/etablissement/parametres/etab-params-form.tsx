'use client'

import { useActionState, useState, useRef } from 'react'
import {
  updateProfilEtablissement,
  updateIban,
  updateEquipements,
  ajouterPhoto,
  supprimerPhoto,
} from '@/lib/actions/parametres'
import { PARAM_INIT } from '@/lib/types/params'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/supabase'
type EtabPhoto = Database['public']['Tables']['etablissement_photos']['Row']

type EtabProfile = Database['public']['Tables']['etablissement_profiles']['Row']

// ─── Constantes ───────────────────────────────────────────────────────────────

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

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand'

// ─── Primitives partagés ──────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

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

function StateMessages({ success, error }: { success: boolean; error: string | null }) {
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
        {error}
      </div>
    )
  if (success)
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
        Modifications enregistrées.
      </div>
    )
  return null
}

function SaveButton({ pending, label = 'Enregistrer' }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  )
}

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
    <SectionCard title="Photos">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
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
        {photos.length === 0 && (
          <p className="text-xs text-gray-400">
            La première photo ajoutée sera la photo principale affichée dans le catalogue.
          </p>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Section Équipements ──────────────────────────────────────────────────────

function EquipementsSection({ initialTags }: { initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<{ success: boolean; error: string | null }>({
    success: false,
    error: null,
  })

  function addTag() {
    const t = input.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSave() {
    setSaving(true)
    setState({ success: false, error: null })
    const result = await updateEquipements(tags)
    setSaving(false)
    if (result.error) setState({ success: false, error: result.error })
    else setState({ success: true, error: null })
  }

  return (
    <SectionCard title="Équipements">
      <div className="space-y-4">
        {/* Input tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag() }
            }}
            placeholder="Ex : Piscine, Salle de réception, Parking…"
            className={inputCls + ' flex-1'}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!input.trim()}
            className="px-4 py-2.5 text-sm font-semibold text-brand border border-brand/30 rounded-lg hover:bg-brand/5 transition-colors disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand text-sm font-medium rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-brand/60 hover:text-brand leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <StateMessages success={state.success} error={state.error} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
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
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function EtabParamsForm({ etab, email, etablissementId, photos }: Props) {
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
  const [ibanState, ibanAction, ibanPending] = useActionState(updateIban, PARAM_INIT)
  const [cautionState, cautionAction, cautionPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold text-navy">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez votre fiche et votre compte</p>
      </div>

      {/* 1. Photos */}
      <PhotosSection etablissementId={etablissementId} initialPhotos={photos} />

      {/* 2. Informations du lieu */}
      <SectionCard title="Informations du lieu">
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

      {/* 3. Type et visibilité */}
      <SectionCard title="Type et visibilité">
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

      {/* 4. Équipements */}
      <EquipementsSection initialTags={etab?.equipements ?? []} />

      {/* 5. Capacités et tarifs */}
      <SectionCard title="Capacités et tarifs">
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

      {/* 6. Localisation */}
      <SectionCard title="Localisation">
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

      {/* 7. Coordonnées bancaires */}
      <SectionCard title="Coordonnées bancaires">
        <form action={ibanAction} className="space-y-4">
          <Field label="IBAN" name="iban" defaultValue={etab?.iban} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
          <p className="text-xs text-gray-400 -mt-1">
            Votre IBAN sera affiché sur les factures envoyées aux BDE.
          </p>
          <StateMessages success={ibanState.success} error={ibanState.error} />
          <div className="pt-1"><SaveButton pending={ibanPending} /></div>
        </form>
      </SectionCard>

      {/* 8. Caution */}
      <SectionCard title="Caution">
        <form action={cautionAction} className="space-y-4">
          <Field
            label="Montant de la caution (€)"
            name="caution_montant"
            type="number"
            defaultValue={etab?.caution_montant}
            placeholder="500"
          />
          <p className="text-xs text-gray-400 -mt-1">
            Ce montant sera demandé au BDE à la réservation.
          </p>
          <StateMessages success={cautionState.success} error={cautionState.error} />
          <div className="pt-1"><SaveButton pending={cautionPending} /></div>
        </form>
      </SectionCard>

      {/* 9. Taux de commission (lecture seule) */}
      <SectionCard title="Taux de commission">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-navy tabular-nums">
              {etab?.commission_rate !== null && etab?.commission_rate !== undefined
                ? `${(etab.commission_rate * 100).toFixed(0)} %`
                : '—'}
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

      {/* 10. Compte */}
      <SectionCard title="Compte">
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
                className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

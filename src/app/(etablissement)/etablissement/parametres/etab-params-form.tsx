'use client'

import { useActionState } from 'react'
import {
  updateProfilEtablissement,
  updateIban,
  PARAM_INIT,
} from '@/lib/actions/parametres'
import { signOut } from '@/lib/actions/auth'
import type { Database } from '@/lib/types/supabase'

type EtabProfile = Database['public']['Tables']['etablissement_profiles']['Row']

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand'

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
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
        {error}
      </div>
    )
  }
  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
        Modifications enregistrées.
      </div>
    )
  }
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  etab: EtabProfile | null
  email: string
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function EtabParamsForm({ etab, email }: Props) {
  const [infosState, infosAction, infosPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [capState, capAction, capPending] = useActionState(
    updateProfilEtablissement,
    PARAM_INIT,
  )
  const [ibanState, ibanAction, ibanPending] = useActionState(updateIban, PARAM_INIT)

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold text-navy">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez votre fiche et votre compte</p>
      </div>

      {/* Informations du lieu */}
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
            <Field
              label="Adresse"
              name="adresse"
              defaultValue={etab?.adresse}
              placeholder="12 rue des Vignes"
            />
            <Field
              label="Ville"
              name="ville"
              defaultValue={etab?.ville}
              placeholder="Bordeaux"
            />
            <Field
              label="Code postal"
              name="code_postal"
              defaultValue={etab?.code_postal}
              placeholder="33000"
            />
            <Field
              label="Téléphone"
              name="telephone"
              type="tel"
              defaultValue={etab?.telephone}
              placeholder="05 00 00 00 00"
            />
            <Field
              label="Email de contact"
              name="email_contact"
              type="email"
              defaultValue={etab?.email_contact}
              placeholder="contact@monlieu.fr"
            />
            <Field
              label="Site web"
              name="site_web"
              type="url"
              defaultValue={etab?.site_web}
              placeholder="https://monlieu.fr"
            />
          </div>

          <StateMessages success={infosState.success} error={infosState.error} />
          <div className="pt-1">
            <SaveButton pending={infosPending} />
          </div>
        </form>
      </SectionCard>

      {/* Capacités et tarifs */}
      <SectionCard title="Capacités et tarifs">
        <form action={capAction} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Capacité max"
              name="capacite_max"
              type="number"
              defaultValue={etab?.capacite_max}
              placeholder="200"
            />
            <Field
              label="Nb couchages"
              name="nb_couchages"
              type="number"
              defaultValue={etab?.nb_couchages}
              placeholder="50"
            />
            <Field
              label="Nb chambres"
              name="nb_chambres"
              type="number"
              defaultValue={etab?.nb_chambres}
              placeholder="25"
            />
            <Field
              label="Nb salles de bain"
              name="nb_salles_de_bain"
              type="number"
              defaultValue={etab?.nb_salles_de_bain}
              placeholder="10"
            />
            <Field
              label="Superficie (m²)"
              name="superficie_m2"
              type="number"
              defaultValue={etab?.superficie_m2}
              placeholder="500"
            />
            <Field
              label="Prix de base (€)"
              name="prix_base"
              type="number"
              defaultValue={etab?.prix_base}
              placeholder="1500"
              hint="par nuit ou événement"
            />
          </div>

          <StateMessages success={capState.success} error={capState.error} />
          <div className="pt-1">
            <SaveButton pending={capPending} />
          </div>
        </form>
      </SectionCard>

      {/* Coordonnées bancaires */}
      <SectionCard title="Coordonnées bancaires">
        <form action={ibanAction} className="space-y-4">
          <Field
            label="IBAN"
            name="iban"
            defaultValue={etab?.iban}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          />
          <p className="text-xs text-gray-400 -mt-1">
            Votre IBAN sera affiché sur les factures envoyées aux BDE.
          </p>

          <StateMessages success={ibanState.success} error={ibanState.error} />
          <div className="pt-1">
            <SaveButton pending={ibanPending} />
          </div>
        </form>
      </SectionCard>

      {/* Taux de commission (lecture seule) */}
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

      {/* Compte */}
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

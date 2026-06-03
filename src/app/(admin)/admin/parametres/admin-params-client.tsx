'use client'

import { useState, useTransition } from 'react'
import { updateLinkhoConfig, updateTauxCommission } from '@/lib/actions/admin'

const CONFIG_FIELDS: { key: string; label: string }[] = [
  { key: 'raison_sociale', label: 'Raison sociale' },
  { key: 'siret', label: 'SIRET' },
  { key: 'forme_juridique', label: 'Forme juridique' },
  { key: 'capital_social', label: 'Capital social' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'code_postal', label: 'Code postal' },
  { key: 'ville', label: 'Ville' },
  { key: 'tva_intracommunautaire', label: 'TVA intracommunautaire' },
  { key: 'iban', label: 'IBAN' },
  { key: 'bic', label: 'BIC' },
  { key: 'email', label: 'Email' },
]

type Etablissement = { id: string; nom: string; taux_commission: number | null }

type Props = {
  config: Record<string, string>
  etablissements: Etablissement[]
}

export default function AdminParamsClient({ config, etablissements }: Props) {
  const [configValues, setConfigValues] = useState<Record<string, string>>(config)
  const [configError, setConfigError] = useState<string | null>(null)
  const [configSuccess, setConfigSuccess] = useState(false)
  const [isPendingConfig, startConfigTransition] = useTransition()

  const [tauxValues, setTauxValues] = useState<Record<string, string>>(
    Object.fromEntries(
      etablissements.map((e) => [e.id, String(e.taux_commission ?? 12)])
    )
  )
  const [tauxErrors, setTauxErrors] = useState<Record<string, string>>({})
  const [tauxSuccess, setTauxSuccess] = useState<Record<string, boolean>>({})
  const [pendingTaux, startTauxTransition] = useTransition()

  function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfigError(null)
    setConfigSuccess(false)
    startConfigTransition(async () => {
      const res = await updateLinkhoConfig(configValues)
      if (res.error) { setConfigError(res.error); return }
      setConfigSuccess(true)
    })
  }

  function handleTauxSave(etabId: string) {
    const raw = tauxValues[etabId]
    const taux = parseFloat(raw)
    if (isNaN(taux) || taux < 0 || taux > 100) {
      setTauxErrors((prev) => ({ ...prev, [etabId]: 'Taux invalide (0–100)' }))
      return
    }
    setTauxErrors((prev) => ({ ...prev, [etabId]: '' }))
    setTauxSuccess((prev) => ({ ...prev, [etabId]: false }))
    startTauxTransition(async () => {
      const res = await updateTauxCommission(etabId, taux)
      if (res.error) {
        setTauxErrors((prev) => ({ ...prev, [etabId]: res.error! }))
        return
      }
      setTauxSuccess((prev) => ({ ...prev, [etabId]: true }))
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-navy">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configuration LINKHO et taux de commission</p>
      </div>

      {/* Section 1 — Informations légales */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-5">Informations légales LINKHO</h2>
        <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {CONFIG_FIELDS.map(({ key, label }) => (
              <div key={key} className={key === 'adresse' || key === 'tva_intracommunautaire' || key === 'iban' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={configValues[key] ?? ''}
                  onChange={(e) => setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            ))}
          </div>

          {configError && (
            <p className="text-sm text-red-600">{configError}</p>
          )}
          {configSuccess && (
            <p className="text-sm text-green-600">Informations enregistrées.</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPendingConfig}
              className="px-5 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </section>

      {/* Section 2 — Taux de commission par établissement */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-navy mb-5">Taux de commission par établissement</h2>

        {etablissements.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun établissement enregistré.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_120px_auto] gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pb-2 border-b border-gray-100">
              <span>Établissement</span>
              <span>Taux (%)</span>
              <span></span>
            </div>
            {etablissements.map((etab) => (
              <div key={etab.id} className="grid grid-cols-[1fr_120px_auto] gap-4 items-center px-3 py-2">
                <span className="text-sm text-navy font-medium">{etab.nom}</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={tauxValues[etab.id] ?? '12'}
                    onChange={(e) => setTauxValues((prev) => ({ ...prev, [etab.id]: e.target.value }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                  {tauxErrors[etab.id] && (
                    <p className="text-xs text-red-500 mt-0.5">{tauxErrors[etab.id]}</p>
                  )}
                  {tauxSuccess[etab.id] && (
                    <p className="text-xs text-green-600 mt-0.5">✓ Enregistré</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleTauxSave(etab.id)}
                  disabled={pendingTaux}
                  className="px-3 py-1.5 bg-navy hover:bg-navy/80 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { updateLinkhoConfig, updateTauxCommission } from '@/lib/actions/admin'
import { signOut } from '@/lib/actions/auth'
import { SettingsShell, type SettingsTab } from '@/components/shared/settings-shell'

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
  { key: 'cal_link', label: 'Lien Cal.com' },
]

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
  config: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  commission: (
    <svg {...iconProps}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  compte: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  ),
}

const TABS: SettingsTab[] = [
  { id: 'config', label: 'Configuration LINKHO', icon: ICONS.config },
  { id: 'commission', label: 'Commissions', icon: ICONS.commission },
  { id: 'compte', label: 'Compte', icon: ICONS.compte },
]

type Etablissement = { id: string; nom: string; taux_commission: number | null }

type Props = {
  config: Record<string, string>
  etablissements: Etablissement[]
  email: string
}

export default function AdminParamsClient({ config, etablissements, email }: Props) {
  const [activeTab, setActiveTab] = useState('config')
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
    <SettingsShell
      title="Paramètres"
      subtitle="Configuration LINKHO et taux de commission"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Configuration LINKHO */}
      {activeTab === 'config' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-1">Informations légales LINKHO</h2>
          <p className="text-sm text-gray-400 mb-6">Ces informations apparaissent sur les documents officiels LINKHO</p>
          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {CONFIG_FIELDS.map(({ key, label }) => (
                <div key={key} className={key === 'adresse' || key === 'tva_intracommunautaire' || key === 'iban' || key === 'cal_link' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={configValues[key] ?? ''}
                    onChange={(e) => setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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
                className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Commissions par établissement */}
      {activeTab === 'commission' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-1">Taux de commission par établissement</h2>
          <p className="text-sm text-gray-400 mb-6">Le taux appliqué sur chaque réservation, par établissement</p>

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
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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
      )}

      {/* Compte */}
      {activeTab === 'compte' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-navy mb-1">Compte</h2>
          <p className="text-sm text-gray-400 mb-6">Les informations de connexion associées à votre espace</p>
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
        </section>
      )}
    </SettingsShell>
  )
}

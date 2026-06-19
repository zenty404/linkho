'use client'

import { useState, useEffect } from 'react'
import type { ChampFormulaire, PaiementDetails, MoyenPaiement } from '@/lib/actions/formulaires'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  formulaireId: string
  titre: string
  description: string | null
  prixTotal: number
  champs: ChampFormulaire[]
  evenement: {
    nom: string
    date_debut: string | null
    date_fin: string | null
    nb_places_max: number | null
  } | null
  modePaiement: string | null
  paiementDetails: PaiementDetails | null
  cautionMontant: number | null
  cautionMode: string | null
  cautionSwiklyUrl: string | null
  messageConfirmation: string | null
  moyensPaiement: MoyenPaiement[]
  paiementPlusieursFois: boolean
  paiementPlusieursFoisNb: number
  paiementPlusieursFoisMoyens: string[]
}

// ─── Rendu d'un champ ─────────────────────────────────────────────────────────

function ChampField({
  champ,
  values,
  onChange,
}: {
  champ: ChampFormulaire
  values: Record<string, string | string[]>
  onChange: (id: string, value: string | string[]) => void
}) {
  const val = values[champ.id]
  const strVal = typeof val === 'string' ? val : ''
  const arrVal = Array.isArray(val) ? val : []

  const baseInput =
    'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none transition-colors focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white'

  switch (champ.type) {
    case 'separateur':
      return (
        <div className="col-span-2">
          {champ.libelle && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {champ.libelle}
            </p>
          )}
          <hr className="border-gray-100" />
        </div>
      )

    case 'text_long':
      return (
        <textarea
          id={champ.id}
          required={champ.obligatoire}
          placeholder={champ.placeholder}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          rows={4}
          className={baseInput + ' resize-none'}
        />
      )

    case 'selection_unique':
      return (
        <div className="space-y-2">
          {(champ.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={champ.id}
                value={opt}
                required={champ.obligatoire}
                checked={strVal === opt}
                onChange={() => onChange(champ.id, opt)}
                className="accent-brand w-4 h-4"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy">{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'selection_multiple':
      return (
        <div className="space-y-2">
          {(champ.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                value={opt}
                checked={arrVal.includes(opt)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...arrVal, opt]
                    : arrVal.filter((v) => v !== opt)
                  onChange(champ.id, next)
                }}
                className="accent-brand w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 group-hover:text-navy">{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'liste_deroulante':
      return (
        <select
          id={champ.id}
          required={champ.obligatoire}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput + ' cursor-pointer'}
        >
          <option value="">— Sélectionner —</option>
          {(champ.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )

    case 'oui_non':
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(champ.id, 'true')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              strVal === 'true'
                ? 'bg-brand text-white border-brand'
                : 'border-gray-200 text-gray-600 hover:border-brand/40'
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => onChange(champ.id, 'false')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              strVal === 'false'
                ? 'bg-navy text-white border-navy'
                : 'border-gray-200 text-gray-600 hover:border-navy/40'
            }`}
          >
            Non
          </button>
          {champ.obligatoire && (
            <input
              type="text"
              required
              readOnly
              value={strVal}
              className="sr-only"
              tabIndex={-1}
            />
          )}
        </div>
      )

    case 'date':
      return (
        <input
          type="date"
          id={champ.id}
          required={champ.obligatoire}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput}
        />
      )

    case 'nombre':
      return (
        <input
          type="number"
          id={champ.id}
          required={champ.obligatoire}
          placeholder={champ.placeholder}
          min={champ.validation?.min}
          max={champ.validation?.max}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput}
        />
      )

    case 'email':
      return (
        <input
          type="email"
          id={champ.id}
          required={champ.obligatoire}
          placeholder={champ.placeholder ?? 'exemple@email.com'}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput}
        />
      )

    case 'telephone':
      return (
        <input
          type="tel"
          id={champ.id}
          required={champ.obligatoire}
          placeholder={champ.placeholder ?? '06 00 00 00 00'}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput}
        />
      )

    case 'fichier':
      return (
        <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="text-sm text-gray-400 italic">Upload de fichier bientôt disponible</span>
        </div>
      )

    default:
      return (
        <input
          type="text"
          id={champ.id}
          required={champ.obligatoire}
          placeholder={champ.placeholder}
          value={strVal}
          onChange={(e) => onChange(champ.id, e.target.value)}
          className={baseInput}
        />
      )
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function PublicInscriptionForm({
  formulaireId,
  titre,
  description,
  prixTotal,
  champs,
  evenement,
  modePaiement,
  paiementDetails,
  cautionMontant,
  cautionMode,
  cautionSwiklyUrl,
  messageConfirmation,
  moyensPaiement,
  paiementPlusieursFois,
  paiementPlusieursFoisNb,
  paiementPlusieursFoisMoyens,
}: Props) {
  const [values, setValues] = useState<Record<string, string | string[]>>({})
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [carteFile, setCarteFile] = useState<File | null>(null)
  const [moyenChoisi, setMoyenChoisi] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const moyenChoisiData = moyensPaiement.find((m) => m.type === moyenChoisi) ?? null
  const supportePlusieursFois =
    paiementPlusieursFois && paiementPlusieursFoisMoyens.includes(moyenChoisi)

  useEffect(() => {
    if (!modalOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  function handleChange(id: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const reponses: Record<string, string | string[]> = {}
    for (const champ of champs) {
      if (champ.type === 'separateur') continue
      const val = values[champ.id]
      if (val !== undefined) reponses[champ.id] = val
    }

    const res = await fetch('/api/inscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formulaireId,
        prenom,
        nom,
        email,
        reponses,
        moyen_paiement_choisi: moyenChoisi || null,
        nb_echeances_choisies: supportePlusieursFois ? paiementPlusieursFoisNb : null,
      }),
    })
    const result = await res.json()
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (carteFile && result.data?.id) {
      try {
        const fd = new FormData()
        fd.append('inscriptionId', result.data.id)
        fd.append('file', carteFile)
        await fetch('/api/carte-etudiante', { method: 'POST', body: fd })
      } catch {
        // upload carte étudiante est optionnel — ne bloque pas la confirmation
      }
    }

    setSubmitted(true)
    setModalOpen(true)
  }

  // ─── Données confirmation ─────────────────────────────────────────────────

  const paiementMsg = (() => {
    if (prixTotal <= 0) return null

    // Nouveau système moyens_paiement
    if (moyenChoisiData) {
      switch (moyenChoisiData.type) {
        case 'virement':
          return moyenChoisiData.rib
            ? null // affiché en bloc dédié ci-dessous
            : `Veuillez effectuer un virement de ${fmt(prixTotal)}. L'IBAN vous sera communiqué par le BDE.`
        case 'cheque_especes':
          return moyenChoisiData.message || `Veuillez régler ${fmt(prixTotal)} par chèque ou en espèces au bureau du BDE.`
        case 'helloasso':
          return null
        case 'custom':
          return null
      }
    }

    // Fallback ancien système
    if (!modePaiement) return null
    const p = paiementDetails ?? {}
    switch (modePaiement) {
      case 'virement':
        return p.iban
          ? null
          : `Veuillez effectuer un virement de ${fmt(prixTotal)}. L'IBAN vous sera communiqué par le BDE.`
      case 'cheque':
        return p.ordre
          ? `Veuillez déposer un chèque de ${fmt(prixTotal)} à l'ordre de ${p.ordre} au bureau du BDE.`
          : `Veuillez déposer un chèque de ${fmt(prixTotal)} au bureau du BDE.`
      case 'lydia':
        return p.lydia
          ? `Veuillez envoyer ${fmt(prixTotal)} sur Lydia au numéro ${p.lydia}.`
          : `Veuillez régler ${fmt(prixTotal)} via Lydia. Le numéro vous sera communiqué par le BDE.`
      case 'helloasso':
        return null
      default:
        return null
    }
  })()

  // ─── Formulaire ───────────────────────────────────────────────────────────

  return (
    <>
    {/* ── Modal de confirmation ── */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="pt-8 px-6 pb-5 text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-navy">Inscription confirmée !</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {messageConfirmation && messageConfirmation.trim()
                ? messageConfirmation
                : "Merci pour ton inscription. Tu recevras bientôt plus d'informations."}
            </p>
          </div>

          {/* Instructions paiement */}
          {prixTotal > 0 && (
            <div className="px-6 pb-4">
              <div className="text-left bg-brand/5 border border-brand/20 rounded-xl px-4 py-4 space-y-2">
                <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-2">Paiement</p>

                {/* Nouveau système */}
                {moyenChoisiData?.type === 'virement' && (
                  <>
                    <p className="text-sm text-navy leading-relaxed">
                      Veuillez effectuer un virement de <strong>{fmt(prixTotal)}</strong>.
                    </p>
                    {(moyenChoisiData as Extract<MoyenPaiement, { type: 'virement' }>).rib && (
                      <div className="bg-white rounded-lg border border-brand/20 px-3 py-2 space-y-0.5">
                        <p className="text-xs text-gray-400">IBAN</p>
                        <p className="text-sm font-mono font-medium text-navy">
                          {(moyenChoisiData as Extract<MoyenPaiement, { type: 'virement' }>).rib}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Libellé suggéré</p>
                        <p className="text-sm font-mono text-navy">
                          WEI - {nom.toUpperCase()} {prenom}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {moyenChoisiData?.type === 'cheque_especes' && paiementMsg && (
                  <p className="text-sm text-navy leading-relaxed">{paiementMsg}</p>
                )}

                {moyenChoisiData?.type === 'helloasso' && (
                  <p className="text-sm text-navy leading-relaxed">
                    Veuillez régler votre inscription via HelloAsso :{' '}
                    <a
                      href={(moyenChoisiData as Extract<MoyenPaiement, { type: 'helloasso' }>).lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand-light font-medium underline"
                    >
                      Accéder au formulaire HelloAsso →
                    </a>
                  </p>
                )}

                {moyenChoisiData?.type === 'custom' && (
                  <>
                    <p className="text-sm text-navy leading-relaxed">
                      Veuillez régler votre inscription via{' '}
                      <strong>{(moyenChoisiData as Extract<MoyenPaiement, { type: 'custom' }>).nom}</strong>.
                    </p>
                    {(moyenChoisiData as Extract<MoyenPaiement, { type: 'custom' }>).lien && (
                      <a
                        href={(moyenChoisiData as Extract<MoyenPaiement, { type: 'custom' }>).lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-brand hover:text-brand-light font-medium underline"
                      >
                        Accéder au paiement →
                      </a>
                    )}
                  </>
                )}

                {/* Paiement en plusieurs fois */}
                {supportePlusieursFois && (
                  <p className="text-sm text-navy leading-relaxed border-t border-brand/10 pt-2">
                    Paiement possible en <strong>{paiementPlusieursFoisNb} fois</strong>. Le BDE vous contactera pour organiser les échéances.
                  </p>
                )}

                {/* Fallback ancien système */}
                {!moyenChoisiData && paiementMsg && (
                  <p className="text-sm text-navy leading-relaxed">{paiementMsg}</p>
                )}
                {!moyenChoisiData && modePaiement === 'virement' && paiementDetails?.iban && (
                  <div className="bg-white rounded-lg border border-brand/20 px-3 py-2">
                    <p className="text-xs text-gray-400">IBAN</p>
                    <p className="text-sm font-mono font-medium text-navy">{paiementDetails.iban}</p>
                  </div>
                )}
                {!moyenChoisiData && modePaiement === 'helloasso' && paiementDetails?.helloasso && (
                  <p className="text-sm text-navy leading-relaxed">
                    Veuillez régler votre inscription via HelloAsso :{' '}
                    <a
                      href={paiementDetails.helloasso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand-light font-medium underline"
                    >
                      Accéder au formulaire HelloAsso →
                    </a>
                  </p>
                )}
                {!moyenChoisiData && !paiementMsg && modePaiement !== 'helloasso' && moyensPaiement.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Les informations de paiement vous seront communiquées par email.
                  </p>
                )}
                {!moyenChoisiData && moyensPaiement.length > 0 && !moyenChoisi && (
                  <p className="text-sm text-gray-500">
                    Les informations de paiement dépendent du moyen choisi.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Instructions caution */}
          {cautionMontant && cautionMontant > 0 && (
            <div className="px-6 pb-4">
              <div className="text-left bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Caution</p>
                {cautionMode === 'cheque' && (
                  <p className="text-sm text-navy leading-relaxed">
                    Une caution de {fmt(cautionMontant)} par chèque est demandée. Déposez-le avec votre chèque d&apos;inscription.
                  </p>
                )}
                {cautionMode === 'swikly' && cautionSwiklyUrl && (
                  <p className="text-sm text-navy leading-relaxed">
                    Une caution de {fmt(cautionMontant)} est demandée via Swikly.{' '}
                    <a
                      href={cautionSwiklyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-medium underline"
                    >
                      Cliquez ici pour l&apos;autoriser →
                    </a>
                  </p>
                )}
                {(!cautionMode || (cautionMode === 'swikly' && !cautionSwiklyUrl)) && (
                  <p className="text-sm text-navy leading-relaxed">
                    Une caution de {fmt(cautionMontant)} vous sera demandée. Le BDE vous contactera pour les modalités.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bouton fermer */}
          <div className="px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full py-3 text-center bg-navy hover:bg-navy/90 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full uppercase tracking-widest mb-3">
            LINKHO
          </span>
          <h1 className="text-2xl font-bold text-navy">{titre}</h1>
          {evenement && (
            <p className="text-sm text-gray-400 mt-1">
              {evenement.nom}
              {fmtDate(evenement.date_debut) && (
                <> &middot; {fmtDate(evenement.date_debut)}</>
              )}
            </p>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{description}</p>
          )}
          {prixTotal > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-brand/10 rounded-full">
              <span className="text-sm font-semibold text-brand">{fmt(prixTotal)}</span>
              <span className="text-xs text-brand/70">par personne</span>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Champs identité obligatoires */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Vos informations
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom <span className="text-red-400">*</span>
                </label>
                <input
                  id="prenom"
                  type="text"
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Jean"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  id="nom"
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Dupont"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Champs personnalisés */}
          {champs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Informations complémentaires
              </p>
              <div className="space-y-5">
                {champs.map((champ) => {
                  if (champ.type === 'separateur') {
                    return (
                      <div key={champ.id}>
                        {champ.libelle && (
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                            {champ.libelle}
                          </p>
                        )}
                        <hr className="border-gray-100" />
                      </div>
                    )
                  }
                  return (
                    <div key={champ.id}>
                      <label
                        htmlFor={champ.id}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        {champ.libelle}
                        {champ.obligatoire && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      <ChampField champ={champ} values={values} onChange={handleChange} />
                      {champ.aide && (
                        <p className="text-xs text-gray-400 mt-1">{champ.aide}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Moyen de paiement */}
          {moyensPaiement.length > 0 && prixTotal > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Moyen de paiement
              </p>
              <div className="space-y-2">
                {moyensPaiement.map((m) => {
                  const labels: Record<string, string> = {
                    virement: 'Virement bancaire',
                    cheque_especes: 'Chèque / Espèces',
                    helloasso: 'HelloAsso',
                    custom: (m as Extract<MoyenPaiement, { type: 'custom' }>).nom || 'Partenaire',
                  }
                  return (
                    <label key={m.type} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand/60 hover:bg-brand/5 transition-colors">
                      <input
                        type="radio"
                        name="moyen_paiement"
                        value={m.type}
                        checked={moyenChoisi === m.type}
                        onChange={() => setMoyenChoisi(m.type)}
                        className="accent-brand w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">{labels[m.type]}</span>
                    </label>
                  )
                })}
              </div>

              {supportePlusieursFois && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    Paiement en <strong>{paiementPlusieursFoisNb} fois</strong> disponible pour ce moyen. Le BDE vous contactera pour organiser les échéances.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Carte étudiante */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Carte étudiante
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Carte étudiante <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand/60 hover:bg-brand/5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-gray-500">
                {carteFile ? carteFile.name : 'Sélectionner un fichier jpg, png ou pdf'}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="sr-only"
                onChange={(e) => setCarteFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || submitted}
            className="w-full py-3 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Envoi en cours…' : submitted ? 'Inscription envoyée ✓' : 'Confirmer mon inscription'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            En vous inscrivant, vous acceptez que le BDE organisateur conserve vos informations pour la gestion de l&apos;événement.
          </p>
        </form>

        <p className="text-center text-xs text-gray-300 mt-6">
          Propulsé par LINKHO
        </p>
      </div>
    </div>
    </>
  )
}

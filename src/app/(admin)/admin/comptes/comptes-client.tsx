'use client'

import { useState } from 'react'
import { validerCompte, refuserCompte, type CompteEnAttente } from '@/lib/actions/admin'

function fmtDate(s: string): string {
  const d = new Date(s)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ComptesClient({ initialComptes }: { initialComptes: CompteEnAttente[] }) {
  const [comptes, setComptes] = useState<CompteEnAttente[]>(initialComptes)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [refusingId, setRefusingId] = useState<string | null>(null)
  const [motif, setMotif] = useState('')
  const [motifError, setMotifError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleValider(compte: CompteEnAttente) {
    setValidatingId(compte.userId)
    setActionError(null)
    const result = await validerCompte(compte.userId, compte.role)
    setValidatingId(null)
    if (result.error) {
      setActionError(result.error)
    } else {
      setComptes((prev) => prev.filter((c) => c.userId !== compte.userId))
    }
  }

  function openRefus(userId: string) {
    setRefusingId(userId)
    setMotif('')
    setMotifError(null)
  }

  async function handleRefuser(compte: CompteEnAttente) {
    if (!motif.trim()) {
      setMotifError('Le motif est obligatoire.')
      return
    }
    setActionError(null)
    const result = await refuserCompte(compte.userId, compte.role, motif.trim())
    if (result.error) {
      setActionError(result.error)
    } else {
      setComptes((prev) => prev.filter((c) => c.userId !== compte.userId))
      setRefusingId(null)
      setMotif('')
    }
  }

  if (comptes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-navy mb-1">Aucun compte en attente</p>
        <p className="text-sm text-gray-400">Tous les comptes ont été traités.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      {comptes.map((compte) => (
        <div key={compte.userId} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  compte.role === 'bde'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {compte.role === 'bde' ? 'BDE' : 'Établissement'}
              </span>
              <span className="text-xs text-gray-400">Inscrit le {fmtDate(compte.createdAt)}</span>
            </div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-gray-400">Nom</p>
              <p className="text-sm font-semibold text-navy">{compte.nom}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-navy">{compte.email}</p>
            </div>
            {compte.role === 'bde' && compte.ecole && (
              <div>
                <p className="text-xs text-gray-400">École</p>
                <p className="text-sm text-navy">{compte.ecole}</p>
              </div>
            )}
            {compte.ville && (
              <div>
                <p className="text-xs text-gray-400">Ville</p>
                <p className="text-sm text-navy">{compte.ville}</p>
              </div>
            )}
            {compte.role === 'etablissement' && compte.adresse && (
              <div>
                <p className="text-xs text-gray-400">Adresse</p>
                <p className="text-sm text-navy">{compte.adresse}</p>
              </div>
            )}
            {compte.role === 'etablissement' && compte.capacite_max != null && (
              <div>
                <p className="text-xs text-gray-400">Capacité max</p>
                <p className="text-sm text-navy">{compte.capacite_max} pers.</p>
              </div>
            )}
          </div>

          {/* Zone refus avec motif */}
          {refusingId === compte.userId && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Motif du refus</p>
              <textarea
                value={motif}
                onChange={(e) => { setMotif(e.target.value); setMotifError(null) }}
                placeholder="Ex : Informations insuffisantes, lieu non éligible…"
                rows={3}
                className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg resize-none focus:outline-none focus:border-red-400 bg-white"
              />
              {motifError && <p className="text-xs text-red-600">{motifError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRefuser(compte)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Confirmer le refus
                </button>
                <button
                  type="button"
                  onClick={() => setRefusingId(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {refusingId !== compte.userId && (
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleValider(compte)}
                disabled={validatingId === compte.userId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {validatingId === compte.userId ? 'Validation…' : 'Valider'}
              </button>
              <button
                type="button"
                onClick={() => openRefus(compte.userId)}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Refuser
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

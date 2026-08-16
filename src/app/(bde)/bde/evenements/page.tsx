import Link from 'next/link'
import { getEvenementsByBde, getEvenementComplet } from '@/lib/actions/evenements'
import type { EvenementComplet } from '@/lib/actions/evenements'

const STEPS = [
  { key: 1, label: 'Demande' },
  { key: 2, label: 'Dispo' },
  { key: 3, label: 'Validée' },
  { key: 4, label: 'Acompte' },
  { key: 5, label: 'Payé' },
  { key: 6, label: 'Presta' },
  { key: 7, label: 'EDL arr.' },
  { key: 8, label: 'EDL dép.' },
  { key: 9, label: 'Solde' },
  { key: 10, label: 'Terminé' },
]

function getStepInfo(evt: EvenementComplet): { step: number; error: boolean } {
  const { demande, reservation, etats_des_lieux, devis_prestataires } = evt
  if (!demande) return { step: 1, error: false }
  if (reservation?.statut === 'annulee') return { step: 1, error: true }
  if (demande.statut_disponibilite !== 'disponible') return { step: 1, error: false }
  if (!reservation) return { step: 2, error: false }
  const acompte = reservation.paiements?.find(p => p.type === 'acompte')
  if (!acompte?.confirme) return { step: 4, error: false }
  const devisTraites = devis_prestataires.length === 0 || devis_prestataires.every(dp => dp.statut !== 'en_attente')
  if (!devisTraites) return { step: 6, error: false }
  const edlArrivee = etats_des_lieux?.find(e => e.type === 'arrivee')
  if (!edlArrivee || edlArrivee.statut !== 'signe') return { step: 7, error: false }
  const edlDepart = etats_des_lieux?.find(e => e.type === 'depart')
  if (!edlDepart || edlDepart.statut !== 'signe') return { step: 8, error: false }
  const solde = reservation.paiements?.find(p => p.type === 'solde')
  if (!solde?.confirme) return { step: 9, error: false }
  return { step: 10, error: false }
}

function ProgressTracker({ evt }: { evt: EvenementComplet }) {
  const { step, error } = getStepInfo(evt)
  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {STEPS.map((s, i) => {
        const done = step > s.key
        const current = step === s.key
        const dotColor = done || current
          ? error && current ? 'bg-red-500' : 'bg-brand'
          : 'bg-gray-200'
        const lineColor = done ? 'bg-brand' : 'bg-gray-200'
        return (
          <div key={s.key} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && <div className={`flex-1 h-0.5 ${lineColor}`} />}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor} ${current ? 'ring-2 ring-brand/30 ring-offset-1' : ''}`} />
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-brand' : 'bg-gray-200'}`} />}
            </div>
            <span className={`text-[10px] mt-1.5 text-center leading-tight ${current ? 'text-brand font-semibold' : done ? 'text-gray-500' : 'text-gray-300'}`}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

type DisplayStatut = { label: string; style: string }

function getDisplayStatut(evt: EvenementComplet): DisplayStatut {
  const { reservation, devis, demande } = evt
  if (demande?.statut === 'refusee')
    return { label: 'Demande refusée', style: 'bg-red-100 text-red-700' }
  if (reservation?.statut === 'annulee')
    return { label: 'Annulée', style: 'bg-red-100 text-red-700' }
  if (reservation?.statut === 'terminee')
    return { label: 'Terminé', style: 'bg-green-100 text-green-700' }
  if (reservation?.statut === 'commission_reversee')
    return { label: 'Clôture en cours', style: 'bg-orange-100 text-orange-700' }
  if (reservation?.statut === 'en_attente_acompte')
    return { label: 'Acompte à régler', style: 'bg-yellow-100 text-yellow-700' }
  if (reservation?.statut === 'en_cours')
    return { label: 'Événement terminé', style: 'bg-green-100 text-green-700' }
  if (reservation?.statut && ['confirmee', 'acompte_confirme'].includes(reservation.statut))
    return { label: 'En cours', style: 'bg-blue-100 text-blue-700' }
  if (reservation?.statut === 'devis_signe')
    return { label: 'Réservé', style: 'bg-blue-100 text-blue-700' }
  if (devis?.statut === 'envoye')
    return { label: 'Devis reçu', style: 'bg-yellow-100 text-yellow-700' }
  if (devis?.statut === 'refuse')
    return { label: 'Devis refusé', style: 'bg-red-100 text-red-700' }
  if (demande?.statut_disponibilite === 'non_disponible')
    return { label: 'Non disponible', style: 'bg-red-100 text-red-700' }
  if (demande?.statut_disponibilite === 'disponible' && !devis)
    return { label: 'Disponibilité confirmée', style: 'bg-green-100 text-green-700' }
  if (demande && !devis)
    return { label: 'En attente de réponse', style: 'bg-amber-100 text-amber-700' }
  return { label: 'Nouveau', style: 'bg-gray-100 text-gray-600' }
}

function fmtDate(s: string | null) {
  if (!s) return null
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BdeEvenementsPage() {
  const listResult = await getEvenementsByBde()
  const ids = (listResult.data ?? []).map((e) => e.id)
  const completes = await Promise.all(ids.map((id) => getEvenementComplet(id)))
  const evenements = completes.filter((r) => r.data).map((r) => r.data!)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-navy">Événements</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {evenements.length} événement{evenements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/rechercher"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Nouvel événement
        </Link>
      </div>

      {listResult.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {listResult.error}
        </div>
      )}

      {evenements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400 mb-4">Aucun événement pour le moment.</p>
          <Link
            href="/rechercher"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
          >
            Rechercher un lieu
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {evenements.map((e) => {
            const debut = fmtDate(e.date_debut)
            const fin = fmtDate(e.date_fin)
            const { label, style } = getDisplayStatut(e)
            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-base truncate">{e.nom}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {debut}{fin && debut !== fin ? ` → ${fin}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style}`}>{label}</span>
                    <Link
                      href={`/bde/evenements/${e.id}`}
                      className="px-4 py-1.5 text-xs font-bold bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors"
                    >
                      Voir →
                    </Link>
                  </div>
                </div>
                <ProgressTracker evt={e} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

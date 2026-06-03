import Link from 'next/link'
import { getDemandesEtablissement } from '@/lib/actions/etablissement'
import type { DemandeComplete } from '@/lib/actions/etablissement'

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', ski: 'Ski',
  sportif: 'Sportif', seminaire: 'Séminaire', autre: 'Autre',
}

function getDisplayStatut(d: DemandeComplete): { label: string; style: string } {
  if (d.reservation) {
    const styles: Record<string, string> = {
      terminee: 'bg-green-100 text-green-700',
      commission_reversee: 'bg-orange-100 text-orange-700',
      en_cours: 'bg-green-100 text-green-700',
      confirmee: 'bg-green-100 text-green-700',
      acompte_confirme: 'bg-amber-100 text-amber-700',
      devis_signe: 'bg-blue-100 text-blue-700',
      annulee: 'bg-red-100 text-red-700',
    }
    return {
      label: d.reservation.statut.replace(/_/g, ' '),
      style: styles[d.reservation.statut] ?? 'bg-gray-100 text-gray-600',
    }
  }
  if (d.devis) {
    const styles: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-600',
      envoye: 'bg-blue-100 text-blue-700',
      accepte: 'bg-green-100 text-green-700',
      signe: 'bg-green-100 text-green-700',
      refuse: 'bg-red-100 text-red-700',
    }
    return { label: `Devis ${d.devis.statut}`, style: styles[d.devis.statut] ?? 'bg-gray-100 text-gray-600' }
  }
  const demStyles: Record<string, string> = {
    en_attente: 'bg-amber-100 text-amber-700',
    acceptee: 'bg-green-100 text-green-700',
    refusee: 'bg-red-100 text-red-700',
  }
  return { label: d.statut, style: demStyles[d.statut] ?? 'bg-gray-100 text-gray-600' }
}

function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getGroupe(d: DemandeComplete): 'action' | 'en_cours' | 'termine' {
  if (d.reservation?.statut && ['terminee', 'commission_reversee', 'annulee'].includes(d.reservation.statut)) return 'termine'
  if (d.statut === 'refusee') return 'termine'
  if (d.devis) return 'en_cours'
  return 'action'
}

function DemandeCard({ d }: { d: DemandeComplete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy truncate">
          {d.bde?.nom ?? '—'} <span className="font-normal text-gray-400">· {d.bde?.ecole}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {fmtDate(d.date_debut)} → {fmtDate(d.date_fin)} · {d.nb_participants} pers. · {TYPE_LABELS[d.type_evenement] ?? d.type_evenement}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(() => { const { label, style } = getDisplayStatut(d); return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>
        )})()}
        <Link
          href={`/etablissement/demandes/${d.id}`}
          className="px-3 py-1.5 text-xs font-semibold text-navy border border-navy/20 rounded-lg hover:bg-navy/5 transition-colors"
        >
          Gérer
        </Link>
      </div>
    </div>
  )
}

export default async function EtablissementDemandesPage() {
  const result = await getDemandesEtablissement()
  const demandes = result.data ?? []

  const actionRequise = demandes.filter((d) => getGroupe(d) === 'action')
  const enCours = demandes.filter((d) => getGroupe(d) === 'en_cours')
  const terminees = demandes.filter((d) => getGroupe(d) === 'termine')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-navy">Demandes reçues</h1>
        <p className="text-sm text-gray-400 mt-0.5">{demandes.length} demande{demandes.length !== 1 ? 's' : ''}</p>
      </div>

      {result.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{result.error}</div>
      )}

      {demandes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">Aucune demande reçue pour le moment.</p>
        </div>
      ) : (
        <>
          {actionRequise.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Action requise ({actionRequise.length})</p>
              {actionRequise.map((d) => <DemandeCard key={d.id} d={d} />)}
            </div>
          )}
          {enCours.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">En cours ({enCours.length})</p>
              {enCours.map((d) => <DemandeCard key={d.id} d={d} />)}
            </div>
          )}
          {terminees.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Terminées / Annulées ({terminees.length})</p>
              {terminees.map((d) => <DemandeCard key={d.id} d={d} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

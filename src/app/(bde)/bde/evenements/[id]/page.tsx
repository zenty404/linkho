import { notFound } from 'next/navigation'
import { getEvenementComplet } from '@/lib/actions/evenements'
import { getLieuxSuggeres, type LieuPublic } from '@/lib/actions/public'
import EvenementDetail from './evenement-detail'

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getEvenementComplet(id)
  if (!result.data) notFound()

  let suggestions: LieuPublic[] = []
  const { demande } = result.data
  if (demande?.statut === 'refusee' && result.data.date_debut && result.data.date_fin) {
    suggestions = await getLieuxSuggeres({
      lieuExcluId: demande.etablissement_id,
      typeEvenement: demande.type_evenement,
      dateDebut: result.data.date_debut,
      dateFin: result.data.date_fin,
      nbParticipants: demande.nb_participants,
    }).catch(() => [])
  }

  return <EvenementDetail evenement={result.data} suggestions={suggestions} />
}

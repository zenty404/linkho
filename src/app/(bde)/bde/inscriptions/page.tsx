import { getEvenementsByBde } from '@/lib/actions/evenements'
import { getFormulaireByEvenement } from '@/lib/actions/formulaires'
import { getInscriptionsByEvenement } from '@/lib/actions/inscriptions'
import type { InscriptionWithDetails } from '@/lib/actions/inscriptions'
import { InscriptionsClient } from './inscriptions-client'
import type { Database } from '@/lib/types/supabase'

type Evenement = Database['public']['Tables']['evenements']['Row']

type Props = {
  searchParams: Promise<{ evenement_id?: string }>
}

export default async function BdeInscriptionsPage({ searchParams }: Props) {
  const { evenement_id } = await searchParams

  const evenementsResult = await getEvenementsByBde()
  const evenements = evenementsResult.data ?? []

  let inscriptions: InscriptionWithDetails[] = []
  let evenement: Evenement | null = null
  let formulaireId: string | null = null

  if (evenement_id) {
    const [inscriptionsResult, formulaireResult] = await Promise.all([
      getInscriptionsByEvenement(evenement_id),
      getFormulaireByEvenement(evenement_id),
    ])
    inscriptions = inscriptionsResult.data ?? []
    evenement = evenements.find((e) => e.id === evenement_id) ?? null
    formulaireId = formulaireResult.data?.id ?? null
  }

  return (
    <InscriptionsClient
      evenements={evenements}
      inscriptions={inscriptions}
      evenementId={evenement_id ?? null}
      evenement={evenement}
      formulaireId={formulaireId}
    />
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ChampFormulaire, PaiementDetails } from '@/lib/actions/formulaires'
import { PublicInscriptionForm } from './public-form'

type EvenementSnippet = {
  nom: string
  date_debut: string | null
  date_fin: string | null
  nb_places_max: number | null
}

type Props = { params: Promise<{ formulaireId: string }> }

export default async function InscriptionPubliquePage({ params }: Props) {
  const { formulaireId } = await params

  const supabase = await createClient()

  const { data: formulaire } = await supabase
    .from('formulaire_inscriptions')
    .select('*, evenement:evenements(nom, date_debut, date_fin, nb_places_max)')
    .eq('id', formulaireId)
    .eq('publie', true)
    .maybeSingle()

  if (!formulaire) notFound()

  const champs = (formulaire.champs ?? []) as unknown as ChampFormulaire[]
  const evenement = (formulaire.evenement ?? null) as EvenementSnippet | null

  return (
    <PublicInscriptionForm
      formulaireId={formulaireId}
      titre={formulaire.titre}
      description={formulaire.description ?? null}
      prixTotal={formulaire.prix_total ?? 0}
      champs={champs}
      evenement={evenement}
      modePaiement={formulaire.mode_paiement ?? null}
      paiementDetails={(formulaire.paiement_details as PaiementDetails) ?? null}
      cautionMontant={formulaire.caution_montant ?? null}
      cautionMode={formulaire.caution_mode ?? null}
      cautionSwiklyUrl={formulaire.caution_swikly_url ?? null}
    />
  )
}

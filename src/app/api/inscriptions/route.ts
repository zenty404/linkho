import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { formulaireId, prenom, nom, email, reponses, moyen_paiement_choisi, nb_echeances_choisies } = body

  console.log('formulaireId reçu:', formulaireId)

  const { data: formulaire, error: formError } = await supabaseAdmin
    .from('formulaire_inscriptions')
    .select('evenement_id, bde_id, prix_total, publie, caution_montant')
    .eq('id', formulaireId)
    .eq('publie', true)
    .maybeSingle()

  console.log('formulaire trouvé:', formulaire)
  console.log('erreur:', formError)

  if (!formulaire) {
    return NextResponse.json({ error: 'Formulaire introuvable.' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('inscriptions')
    .insert({
      formulaire_id: formulaireId,
      evenement_id: formulaire.evenement_id,
      bde_id: formulaire.bde_id,
      prenom,
      nom,
      email,
      reponses: reponses ?? {},
      montant_total: formulaire.prix_total ?? 0,
      caution_montant: formulaire.caution_montant ?? null,
      moyen_paiement_choisi: moyen_paiement_choisi ?? null,
      nb_echeances_choisies: nb_echeances_choisies ?? null,
      statut: 'en_attente',
      statut_paiement: 'en_attente',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

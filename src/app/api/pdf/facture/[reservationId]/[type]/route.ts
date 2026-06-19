import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { FacturePdf } from '@/lib/pdf/facture-pdf'
import type { FacturePdfData } from '@/lib/pdf/facture-pdf'

type EtabRow = { nom: string; adresse: string | null; ville: string | null; code_postal: string | null; telephone: string | null; email_contact: string | null; iban: string | null; bic: string | null; titulaire_compte: string | null }
type BdeRow = { nom: string; ecole: string; ville: string | null }
type EvenementRow = { nom: string; date_debut: string | null; date_fin: string | null }

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reservationId: string; type: string }> }
) {
  const { reservationId, type } = await params

  if (type !== 'acompte' && type !== 'solde') {
    return NextResponse.json({ error: 'Type invalide.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*, devis:devis(numero, tva_taux, etablissement_id, bde_id, date_evenement_debut, date_evenement_fin), etablissement:etablissement_profiles(nom, adresse, ville, code_postal, telephone, email_contact), bde:bde_profiles(nom, ecole, ville)')
    .eq('id', reservationId)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable.', detail: error?.message }, { status: 404 })
  }

  const devisRaw = reservation.devis as { numero: string; tva_taux: number; etablissement_id: string; bde_id: string; date_evenement_debut: string | null; date_evenement_fin: string | null } | null
  const etabRaw = reservation.etablissement as EtabRow | null
  const bdeRaw = reservation.bde as BdeRow | null

  // Fetch legal fields
  const etabId = devisRaw?.etablissement_id ?? reservation.etablissement_id
  const { data: etabLegalRaw, error: legalError } = await supabase
    .from('etablissement_profiles')
    .select('siret, forme_juridique, capital_social, tva_intracommunautaire, conditions_paiement, titulaire_compte, iban, bic')
    .eq('id', etabId)
    .single()

  void legalError

  const etabLegal = etabLegalRaw as Record<string, unknown> | null

  // Fetch événement
  let evenement: EvenementRow | null = null
  const { data: evenementData } = await supabase
    .from('evenements')
    .select('nom, date_debut, date_fin')
    .eq('bde_id', reservation.bde_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (evenementData) evenement = evenementData as EvenementRow

  const tva_taux = devisRaw?.tva_taux ?? 0.2
  const montant_ttc = type === 'acompte' ? reservation.acompte_montant : reservation.solde_montant
  const montant_ht = montant_ttc / (1 + tva_taux)
  const montant_tva = montant_ttc - montant_ht

  const year = new Date().getFullYear()
  const shortId = reservationId.slice(0, 8).toUpperCase()
  const factureNumero = `${year}-${shortId}-${type.toUpperCase()}`

  const pdfData: FacturePdfData = {
    etablissement: {
      nom: etabRaw?.nom ?? '',
      adresse: etabRaw?.adresse,
      ville: etabRaw?.ville,
      code_postal: etabRaw?.code_postal,
      telephone: etabRaw?.telephone,
      email_contact: etabRaw?.email_contact,
      siret: etabLegal?.siret as string | null,
      forme_juridique: etabLegal?.forme_juridique as string | null,
      capital_social: etabLegal?.capital_social as string | null,
      tva_intracommunautaire: etabLegal?.tva_intracommunautaire as string | null,
      conditions_paiement: etabLegal?.conditions_paiement as string | null,
      titulaire_compte: etabLegal?.titulaire_compte as string | null,
      iban: etabLegal?.iban as string | null,
      bic: etabLegal?.bic as string | null,
    },
    bde: {
      nom: bdeRaw?.nom ?? '',
      ecole: bdeRaw?.ecole ?? '',
      ville: bdeRaw?.ville,
    },
    factureNumero,
    dateEmission: new Date().toISOString(),
    type,
    montant_ht,
    montant_tva,
    montant_ttc,
    tva_taux,
    evenement_nom: evenement?.nom ?? 'Événement',
    evenement_date_debut: devisRaw?.date_evenement_debut ?? evenement?.date_debut,
    evenement_date_fin: devisRaw?.date_evenement_fin ?? evenement?.date_fin,
    reference_reservation: reservation.reference,
  }

  const buffer = await renderToBuffer(createElement(FacturePdf, { data: pdfData }) as ReactElement<DocumentProps>)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${factureNumero}.pdf"`,
    },
  })
}

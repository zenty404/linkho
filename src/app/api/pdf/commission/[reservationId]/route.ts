import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { CommissionPdf } from '@/lib/pdf/commission-pdf'
import type { CommissionPdfData } from '@/lib/pdf/commission-pdf'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(
      '*, devis:devis(date_evenement_debut, date_evenement_fin, etablissement_id), etablissement:etablissement_profiles(nom, adresse, code_postal, ville)'
    )
    .eq('id', reservationId)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
  }

  const devisRaw = reservation.devis as {
    date_evenement_debut: string | null
    date_evenement_fin: string | null
    etablissement_id: string
  } | null
  const etabRaw = reservation.etablissement as {
    nom: string
    adresse: string | null
    code_postal: string | null
    ville: string | null
  } | null

  const etabId = devisRaw?.etablissement_id ?? reservation.etablissement_id
  const { data: etabLegalRaw } = await supabase
    .from('etablissement_profiles')
    .select('siret, tva_intracommunautaire')
    .eq('id', etabId)
    .single()
  const etabLegal = etabLegalRaw as Record<string, string | null> | null

  const { data: configRows } = await supabase
    .from('linkho_config')
    .select('cle, valeur')
  const config: Record<string, string> = {}
  for (const row of configRows ?? []) {
    config[row.cle] = row.valeur ?? ''
  }

  const year = new Date().getFullYear()
  const shortId = reservationId.slice(0, 8).toUpperCase()
  const factureNumero = `${year}-${shortId}`

  const pdfData: CommissionPdfData = {
    linkho: {
      raison_sociale: config.raison_sociale ?? '',
      adresse: config.adresse ?? '',
      code_postal: config.code_postal ?? '',
      ville: config.ville ?? '',
      siret: config.siret ?? '',
      tva_intracommunautaire: config.tva_intracommunautaire ?? '',
      iban: config.iban ?? '',
      bic: config.bic ?? '',
      email: config.email ?? '',
    },
    etablissement: {
      nom: etabRaw?.nom ?? '',
      adresse: etabRaw?.adresse,
      code_postal: etabRaw?.code_postal,
      ville: etabRaw?.ville,
      siret: etabLegal?.siret,
      tva_intracommunautaire: etabLegal?.tva_intracommunautaire,
    },
    factureNumero,
    dateEmission: new Date().toISOString(),
    commission_montant: reservation.commission_montant,
    date_debut: devisRaw?.date_evenement_debut ?? reservation.date_debut,
    date_fin: devisRaw?.date_evenement_fin ?? reservation.date_fin,
  }

  const buffer = await renderToBuffer(
    createElement(CommissionPdf, { data: pdfData }) as ReactElement<DocumentProps>
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-commission-LINKHO-${factureNumero}.pdf"`,
    },
  })
}

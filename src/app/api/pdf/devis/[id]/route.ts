import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { DevisPdf } from '@/lib/pdf/devis-pdf'
import type { DevisPdfData } from '@/lib/pdf/devis-pdf'

type EtabRow = { nom: string; adresse: string | null; ville: string | null; code_postal: string | null; telephone: string | null; email_contact: string | null; site_web: string | null }
type BdeRow = { nom: string; ecole: string; ville: string | null }

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, items:devis_items(libelle, description, quantite, prix_unitaire), etablissement:etablissement_profiles(nom, adresse, ville, code_postal, telephone, email_contact, site_web), bde:bde_profiles(nom, ecole, ville)')
    .eq('id', id)
    .single()

  if (devisError || !devis) {
    return NextResponse.json({ error: 'Devis introuvable.', detail: devisError?.message }, { status: 404 })
  }

  const etabRaw = devis.etablissement as EtabRow | null

  // Fetch legal fields (not in generated types yet)
  const { data: etabLegalRaw, error: legalError } = await supabase
    .from('etablissement_profiles')
    .select('siret, forme_juridique, capital_social, tva_intracommunautaire, conditions_paiement, delai_validite_devis')
    .eq('id', devis.etablissement_id)
    .single()

  void legalError

  const etabLegal = etabLegalRaw as Record<string, unknown> | null
  const bdeRaw = devis.bde as BdeRow | null

  const pdfData: DevisPdfData = {
    etablissement: {
      nom: etabRaw?.nom ?? '',
      adresse: etabRaw?.adresse,
      ville: etabRaw?.ville,
      code_postal: etabRaw?.code_postal,
      telephone: etabRaw?.telephone,
      email_contact: etabRaw?.email_contact,
      site_web: etabRaw?.site_web,
      siret: etabLegal?.siret as string | null,
      forme_juridique: etabLegal?.forme_juridique as string | null,
      capital_social: etabLegal?.capital_social as string | null,
      tva_intracommunautaire: etabLegal?.tva_intracommunautaire as string | null,
      conditions_paiement: etabLegal?.conditions_paiement as string | null,
      delai_validite_devis: etabLegal?.delai_validite_devis as number | null,
    },
    bde: {
      nom: bdeRaw?.nom ?? '',
      ecole: bdeRaw?.ecole ?? '',
      ville: bdeRaw?.ville,
    },
    numero: devis.numero ?? id.slice(0, 8).toUpperCase(),
    envoye_le: devis.envoye_le,
    sous_total_ht: devis.sous_total_ht,
    total_ttc: devis.total_ttc,
    tva_taux: devis.tva_taux,
    acompte_taux: devis.acompte_taux,
    message_client: devis.message_client,
    items: (devis.items as DevisPdfData['items']) ?? [],
  }

  const buffer = await renderToBuffer(createElement(DevisPdf, { data: pdfData }) as ReactElement<DocumentProps>)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${pdfData.numero}.pdf"`,
    },
  })
}

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paiementId: string }> }
) {
  const { paiementId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  const { data: paiement } = await supabase
    .from('paiements')
    .select('justificatif_url')
    .eq('id', paiementId)
    .single()

  if (!paiement?.justificatif_url) {
    return NextResponse.json({ error: 'Aucun justificatif trouvé.' }, { status: 404 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('justificatifs')
    .createSignedUrl(paiement.justificatif_url, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien.' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

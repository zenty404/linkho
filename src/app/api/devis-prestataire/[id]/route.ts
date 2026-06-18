import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  const { data: dp } = await supabase
    .from('devis_prestataires')
    .select('pdf_path')
    .eq('id', id)
    .single()

  if (!dp?.pdf_path) {
    return NextResponse.json({ error: 'Devis prestataire introuvable.' }, { status: 404 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('documents')
    .createSignedUrl(dp.pdf_path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien.' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

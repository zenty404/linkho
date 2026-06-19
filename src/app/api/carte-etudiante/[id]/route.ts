import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  const { data: inscription } = await supabase
    .from('inscriptions')
    .select('carte_etudiante_url')
    .eq('id', id)
    .single()

  if (!inscription?.carte_etudiante_url) {
    return NextResponse.json({ error: 'Aucune carte étudiante trouvée.' }, { status: 404 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('documents')
    .createSignedUrl(inscription.carte_etudiante_url, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien.' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

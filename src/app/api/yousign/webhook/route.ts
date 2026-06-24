import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await request.json()

  const eventName = payload.event_name ?? payload.name
  if (eventName !== 'signer.done') {
    return NextResponse.json({ received: true })
  }

  const signatureRequestId = payload.data?.signer?.signature_request?.id
  if (!signatureRequestId) {
    return NextResponse.json({ received: true })
  }

  const adminClient = createAdminClient()
  await adminClient
    .from('devis_prestataires')
    .update({ statut: 'signe', signe_le: new Date().toISOString() })
    .eq('yousign_signature_request_id', signatureRequestId)

  return NextResponse.json({ received: true })
}

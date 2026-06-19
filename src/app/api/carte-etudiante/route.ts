import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const inscriptionId = formData.get('inscriptionId') as string | null
  const file = formData.get('file') as File | null

  if (!inscriptionId || !file) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté (jpg, png, pdf).' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo).' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `cartes-etudiantes/${inscriptionId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('documents')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  await adminClient
    .from('inscriptions')
    .update({ carte_etudiante_url: path, carte_etudiante_nom: file.name })
    .eq('id', inscriptionId)

  return NextResponse.json({ success: true })
}

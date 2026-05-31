import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EtabParamsForm } from './etab-params-form'
import type { Database } from '@/lib/types/supabase'

type EtabPhoto = Database['public']['Tables']['etablissement_photos']['Row']

export default async function EtablissementParametresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: etab } = await supabase
    .from('etablissement_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: photos } = etab?.id
    ? await supabase
        .from('etablissement_photos')
        .select('*')
        .eq('etablissement_id', etab.id)
        .order('ordre', { ascending: true })
    : { data: [] as EtabPhoto[] }

  return (
    <EtabParamsForm
      etab={etab}
      email={user.email ?? ''}
      etablissementId={etab?.id ?? null}
      photos={photos ?? []}
    />
  )
}

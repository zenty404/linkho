import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EtabParamsForm } from './etab-params-form'

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

  return <EtabParamsForm etab={etab} email={user.email ?? ''} />
}

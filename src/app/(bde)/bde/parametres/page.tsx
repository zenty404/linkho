import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BdeParamsForm } from './bde-params-form'

export default async function BdeParametresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bde } = await supabase
    .from('bde_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return <BdeParamsForm bde={bde} email={user.email ?? ''} />
}

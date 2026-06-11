import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EtabParamsForm } from './etab-params-form'
import type { Database } from '@/lib/types/supabase'

type EtabPhoto = Database['public']['Tables']['etablissement_photos']['Row']
type Indisponibilite = Database['public']['Tables']['indisponibilites']['Row']

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

  const [photosResult, indisposResult] = await Promise.all([
    etab?.id
      ? supabase
          .from('etablissement_photos')
          .select('*')
          .eq('etablissement_id', etab.id)
          .order('ordre', { ascending: true })
      : Promise.resolve({ data: [] as EtabPhoto[] }),
    etab?.id
      ? supabase
          .from('indisponibilites')
          .select('*')
          .eq('etablissement_id', etab.id)
          .order('date_debut', { ascending: true })
      : Promise.resolve({ data: [] as Indisponibilite[] }),
  ])

  return (
    <EtabParamsForm
      etab={etab}
      email={user.email ?? ''}
      etablissementId={etab?.id ?? null}
      photos={photosResult.data ?? []}
      indisponibilites={indisposResult.data ?? []}
    />
  )
}

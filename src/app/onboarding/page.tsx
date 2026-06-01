import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BdeOnboardingForm, EtabOnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined

  if (role === 'bde') {
    const { data: bdeId } = await supabase.rpc('get_bde_id')
    if (bdeId) redirect('/bde/dashboard')
  } else if (role === 'etablissement') {
    const { data: etabId } = await supabase.rpc('get_etablissement_id')
    if (etabId) redirect('/etablissement/dashboard')
  } else {
    redirect('/login')
  }

  const isBde = role === 'bde'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            LINKHO
          </span>
          <h1 className="text-2xl font-bold text-navy">
            {isBde ? 'Créez votre profil BDE' : 'Créez votre fiche établissement'}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {isBde
              ? 'Ces informations seront visibles par les établissements partenaires.'
              : 'Ces informations seront visibles par les BDE sur la plateforme.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {isBde ? <BdeOnboardingForm /> : <EtabOnboardingForm />}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Propulsé par LINKHO
        </p>
      </div>
    </div>
  )
}

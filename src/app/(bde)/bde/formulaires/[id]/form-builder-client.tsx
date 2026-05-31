'use client'

import dynamic from 'next/dynamic'
import type { Database } from '@/lib/types/supabase'

type Formulaire = Database['public']['Tables']['formulaire_inscriptions']['Row']

const FormBuilderDynamic = dynamic(() => import('./form-builder').then((m) => m.FormBuilder), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Chargement…
    </div>
  ),
})

export function FormBuilder({ formulaire }: { formulaire: Formulaire }) {
  return <FormBuilderDynamic formulaire={formulaire} />
}

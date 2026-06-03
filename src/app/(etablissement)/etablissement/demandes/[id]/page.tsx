import { notFound } from 'next/navigation'
import { getDemandeComplete } from '@/lib/actions/etablissement'
import DemandeDetail from './demande-detail'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getDemandeComplete(id)
  if (!result.data) notFound()
  return <DemandeDetail demande={result.data} />
}

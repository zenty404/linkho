import { notFound } from 'next/navigation'
import { getEvenementComplet } from '@/lib/actions/evenements'
import EvenementDetail from './evenement-detail'

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getEvenementComplet(id)
  if (!result.data) notFound()
  return <EvenementDetail evenement={result.data} />
}

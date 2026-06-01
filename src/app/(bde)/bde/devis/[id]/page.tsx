import { notFound } from 'next/navigation'
import { getDevisById } from '@/lib/actions/devis'
import { DevisView } from './devis-view'

type Props = {
  params: Promise<{ id: string }>
}

export default async function BdeDevisDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getDevisById(id)

  if (result.error || !result.data) {
    notFound()
  }

  return <DevisView devis={result.data} />
}

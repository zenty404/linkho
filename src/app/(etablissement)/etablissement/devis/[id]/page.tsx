import { notFound } from 'next/navigation'
import { getDevisById } from '@/lib/actions/devis'
import { DevisEditor } from './devis-editor'

type Props = {
  params: Promise<{ id: string }>
}

export default async function DevisPage({ params }: Props) {
  const { id } = await params
  const result = await getDevisById(id)

  if (result.error || !result.data) {
    notFound()
  }

  return <DevisEditor devis={result.data} />
}

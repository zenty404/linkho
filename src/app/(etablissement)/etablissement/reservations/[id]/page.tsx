import { notFound } from 'next/navigation'
import { getReservationById } from '@/lib/actions/reservations'
import { ReservationManager } from './reservation-manager'

type Props = { params: Promise<{ id: string }> }

export default async function EtablissementReservationDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getReservationById(id)

  if (result.error || !result.data) notFound()

  return <ReservationManager reservation={result.data} />
}

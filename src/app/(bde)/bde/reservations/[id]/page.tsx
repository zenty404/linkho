import { notFound } from 'next/navigation'
import { getReservationById } from '@/lib/actions/reservations'
import { ReservationView } from './reservation-view'

type Props = { params: Promise<{ id: string }> }

export default async function BdeReservationDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getReservationById(id)

  if (result.error || !result.data) notFound()

  return <ReservationView reservation={result.data} />
}

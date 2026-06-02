import { getReservationsAdmin } from '@/lib/actions/reservations'
import ReservationsAdminClient from './reservations-admin-client'

export default async function AdminReservationsPage() {
  const result = await getReservationsAdmin()
  return <ReservationsAdminClient reservations={result.data ?? []} error={result.error} />
}

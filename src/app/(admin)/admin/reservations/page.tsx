import { getReservationsAdmin } from '@/lib/actions/reservations'
import { getDisponibilitesAValider } from '@/lib/actions/admin'
import ReservationsAdminClient from './reservations-admin-client'

export default async function AdminReservationsPage() {
  const [reservationsResult, disponibilitesResult] = await Promise.all([
    getReservationsAdmin(),
    getDisponibilitesAValider(),
  ])
  return (
    <ReservationsAdminClient
      reservations={reservationsResult.data ?? []}
      error={reservationsResult.error}
      disponibilites={disponibilitesResult.data ?? []}
    />
  )
}

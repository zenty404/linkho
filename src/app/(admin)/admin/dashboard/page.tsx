import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: enAttenteClôture },
    { count: cloturees },
    { data: caData },
  ] = await Promise.all([
    supabase.from('reservations').select('id', { count: 'exact', head: true }),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('statut', 'commission_reversee'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('statut', 'terminee'),
    supabase.from('reservations').select('montant_ttc').eq('statut', 'terminee'),
  ])

  const ca = caData?.reduce((sum, r) => sum + r.montant_ttc, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-navy">Dashboard Admin</h1>
        <p className="text-sm text-gray-400 mt-0.5">Vue d&apos;ensemble de la plateforme LINKHO</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total réservations"
          value={total ?? 0}
          color="text-navy"
        />
        <KpiCard
          label="En attente de clôture"
          value={enAttenteClôture ?? 0}
          color={(enAttenteClôture ?? 0) > 0 ? 'text-amber-600' : 'text-navy'}
          badge={(enAttenteClôture ?? 0) > 0}
        />
        <KpiCard
          label="Clôturées"
          value={cloturees ?? 0}
          color="text-green-600"
        />
        <KpiCard
          label="CA plateforme"
          value={ca.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          color="text-navy"
        />
      </div>

      {(enAttenteClôture ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-amber-800 font-medium">
            {enAttenteClôture} réservation{(enAttenteClôture ?? 0) > 1 ? 's' : ''} en attente de clôture
          </p>
          <Link
            href="/admin/reservations"
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Voir les réservations à clôturer →
          </Link>
        </div>
      )}

      <div className="flex">
        <Link
          href="/admin/reservations"
          className="px-4 py-2 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
        >
          Gérer les réservations
        </Link>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
  badge,
}: {
  label: string
  value: number | string
  color: string
  badge?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Action
          </span>
        )}
      </div>
    </div>
  )
}

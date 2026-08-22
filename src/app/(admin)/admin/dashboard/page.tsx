import Link from 'next/link'
import { FadeUp } from '@/components/shared/fade-up'
import { createClient } from '@/lib/supabase/server'
import { getLastMonths, monthKey } from '@/lib/chart-months'
import { MiniAreaChart } from './mini-area-chart'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'

const RES_STATUS: Record<string, { label: string; cls: string }> = {
  devis_signe:      { label: 'Devis signé',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acompte_confirme: { label: 'Acompte confirmé', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  confirmee:        { label: 'Confirmée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  en_cours:         { label: 'En cours',     cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  terminee:         { label: 'Terminée',     cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  commission_reversee: { label: 'Clôturée',  cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  annulee:          { label: 'Annulée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

type CompteEnAttente = {
  id: string
  nom: string
  sousLabel: string
  type: 'bde' | 'etablissement'
  created_at: string
}

type ReservationRecente = {
  id: string
  reference: string
  date_debut: string
  statut: string
  montant_ttc: number
  bde: { nom: string } | null
  etablissement: { nom: string } | null
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function Badge({ statut }: { statut: string }) {
  const m = RES_STATUS[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  )
}

function KpiCard({
  icon,
  label,
  value,
  badge,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge?: string
  gradient: string
}) {
  return (
    <div className={`rounded-2xl p-6 text-white ${gradient}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{badge}</span>
        )}
      </div>
      <p className="text-3xl font-bold mb-1 truncate">{value}</p>
      <p className="text-sm text-white/70">{label}</p>
    </div>
  )
}

function SectionCard({
  title,
  href,
  linkLabel = 'Voir tout →',
  children,
}: {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-brand hover:text-brand-light font-medium transition-colors">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-6 py-8 text-sm text-center text-gray-400">{text}</p>
}

function CompteRow({ c }: { c: CompteEnAttente }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">{c.nom}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.sousLabel}</p>
      </div>
      <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 rounded-full shrink-0">
        {c.type === 'bde' ? 'BDE' : 'Établissement'}
      </span>
    </div>
  )
}

function ReservationRow({ r }: { r: ReservationRecente }) {
  return (
    <Link
      href={`/admin/reservations`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">
          {r.bde?.nom ?? '—'} <span className="text-gray-400 font-normal">→</span> {r.etablissement?.nom ?? '—'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">
          {r.reference} · {fmtDate(r.date_debut)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-navy tabular-nums">{fmt(r.montant_ttc)}</span>
        <Badge statut={r.statut} />
      </div>
    </Link>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
function UserCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
    </svg>
  )
}
function EuroIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M19 7a5 5 0 00-8 4M19 15a5 5 0 01-8-4M4 10h9M4 13h7" />
    </svg>
  )
}
function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M9 6h.01M9 10h.01M9 14h.01M15 6h.01M15 10h.01M15 14h.01" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const months = getLastMonths(6)
  const rangeStart = months[0].start.toISOString()

  const [
    { count: total },
    { count: bdeAValider },
    { count: etabAValider },
    { data: commissionData },
    { count: lieuxActifs },
    { data: bdeEnAttente },
    { data: etabEnAttente },
    { data: dernieresRes },
    { data: resMensuelles },
    { data: bdeMensuels },
    { data: etabMensuels },
  ] = await Promise.all([
    supabase.from('reservations').select('id', { count: 'exact', head: true }),
    supabase.from('bde_profiles').select('id', { count: 'exact', head: true }).eq('compte_valide', false),
    supabase.from('etablissement_profiles').select('id', { count: 'exact', head: true }).eq('compte_valide', false),
    supabase.from('reservations').select('commission_montant').neq('statut', 'annulee'),
    supabase.from('etablissement_profiles').select('id', { count: 'exact', head: true }).eq('actif', true).eq('visible', true),
    supabase.from('bde_profiles').select('id, nom, ecole, created_at').eq('compte_valide', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('etablissement_profiles').select('id, nom, ville, created_at').eq('compte_valide', false).order('created_at', { ascending: false }).limit(5),
    supabase
      .from('reservations')
      .select('id, reference, date_debut, statut, montant_ttc, bde:bde_profiles(nom), etablissement:etablissement_profiles(nom)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reservations')
      .select('created_at, commission_montant')
      .gte('created_at', rangeStart),
    supabase.from('bde_profiles').select('created_at').gte('created_at', rangeStart),
    supabase.from('etablissement_profiles').select('created_at').gte('created_at', rangeStart),
  ])

  const commissionTotale = (commissionData ?? []).reduce((sum, r) => sum + r.commission_montant, 0)

  const reservationsParMoisMap: Record<string, number> = {}
  const commissionsParMoisMap: Record<string, number> = {}
  for (const r of resMensuelles ?? []) {
    const k = monthKey(r.created_at)
    reservationsParMoisMap[k] = (reservationsParMoisMap[k] ?? 0) + 1
    commissionsParMoisMap[k] = (commissionsParMoisMap[k] ?? 0) + r.commission_montant
  }
  const reservationsParMois = months.map((m) => ({ name: m.label, value: reservationsParMoisMap[m.key] ?? 0 }))
  const commissionsParMois = months.map((m) => ({ name: m.label, value: commissionsParMoisMap[m.key] ?? 0 }))

  const nouveauxComptesParMoisMap: Record<string, number> = {}
  for (const c of [...(bdeMensuels ?? []), ...(etabMensuels ?? [])]) {
    const k = monthKey(c.created_at)
    nouveauxComptesParMoisMap[k] = (nouveauxComptesParMoisMap[k] ?? 0) + 1
  }
  const nouveauxComptesParMois = months.map((m) => ({ name: m.label, value: nouveauxComptesParMoisMap[m.key] ?? 0 }))

  const comptesEnAttente: CompteEnAttente[] = [
    ...(bdeEnAttente ?? []).map((b) => ({
      id: b.id,
      nom: b.nom,
      sousLabel: b.ecole,
      type: 'bde' as const,
      created_at: b.created_at,
    })),
    ...(etabEnAttente ?? []).map((e) => ({
      id: e.id,
      nom: e.nom,
      sousLabel: e.ville ?? '—',
      type: 'etablissement' as const,
      created_at: e.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const comptesAValider = (bdeAValider ?? 0) + (etabAValider ?? 0)

  return (
    <div className="flex flex-col gap-5">
      <FadeUp delay={0}>
        <div>
          <h1 className="text-lg font-bold text-navy">Dashboard Admin</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue d&apos;ensemble de la plateforme LINKHO</p>
        </div>
      </FadeUp>

      {/* KPIs */}
      <FadeUp delay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<CalendarIcon />}
          label="Réservations totales"
          value={String(total ?? 0)}
          gradient="bg-navy"
        />
        <KpiCard
          icon={<UserCheckIcon />}
          label="Comptes à valider"
          value={String(comptesAValider)}
          gradient="bg-red-500"
        />
        <KpiCard
          icon={<EuroIcon />}
          label="Commission totale"
          value={fmt(commissionTotale)}
          gradient="bg-emerald-600"
        />
        <KpiCard
          icon={<BuildingIcon />}
          label="Lieux actifs"
          value={String(lieuxActifs ?? 0)}
          gradient="bg-violet-600"
        />
      </FadeUp>

      {comptesAValider > 0 && (
        <FadeUp delay={0.12} className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-amber-800 font-medium">
            {comptesAValider} compte{comptesAValider > 1 ? 's' : ''} en attente de validation
          </p>
          <Link
            href="/admin/comptes"
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Voir les comptes →
          </Link>
        </FadeUp>
      )}

      {/* Graphiques */}
      <FadeUp delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-navy mb-6">Réservations par mois</h3>
          <MiniAreaChart data={reservationsParMois} color="#f49915" gradientId="colorReservationsAdmin" height={180} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-navy mb-6">Commissions générées par mois</h3>
          <MiniAreaChart data={commissionsParMois} color="#10b981" gradientId="colorCommissionsAdmin" height={180} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-navy mb-6">Nouveaux comptes par mois</h3>
          <MiniAreaChart data={nouveauxComptesParMois} color="#8b5cf6" gradientId="colorComptesAdmin" height={180} />
        </div>
      </FadeUp>

      {/* Sections (2 colonnes sur grand écran) */}
      <FadeUp delay={0.2} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Comptes en attente de validation */}
        <SectionCard title="Comptes en attente de validation">
          {comptesEnAttente.length === 0 ? (
            <EmptyRow text="Aucun compte en attente." />
          ) : (
            comptesEnAttente.map((c) => <CompteRow key={c.id} c={c} />)
          )}
        </SectionCard>

        {/* Dernières réservations */}
        <SectionCard title="Dernières réservations" href="/admin/reservations" linkLabel="Voir toutes →">
          {(dernieresRes ?? []).length === 0 ? (
            <EmptyRow text="Aucune réservation." />
          ) : (
            (dernieresRes ?? []).map((r) => (
              <ReservationRow key={r.id} r={r as unknown as ReservationRecente} />
            ))
          )}
        </SectionCard>
      </FadeUp>
    </div>
  )
}

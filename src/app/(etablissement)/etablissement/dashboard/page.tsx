import Link from 'next/link'
import { FadeUp } from '@/components/shared/fade-up'
import { getDashboardEtablissement } from '@/lib/actions/dashboard'
import type { ReservationEtab, DemandeRecente } from '@/lib/actions/dashboard'
import { RevenusChart } from './revenus-chart'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'

const RES_STATUS: Record<string, { label: string; cls: string }> = {
  devis_signe:      { label: 'Devis signé',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acompte_confirme: { label: 'Acompte reçu', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  confirmee:        { label: 'Confirmée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  en_cours:         { label: 'En cours',     cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  terminee:         { label: 'Terminée',     cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  commission_reversee: { label: 'Clôturée',  cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  annulee:          { label: 'Annulée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const DEMANDE_STATUS: Record<string, { label: string; cls: string }> = {
  en_attente:   { label: 'En attente',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  devis_envoye: { label: 'Devis envoyé', cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acceptee:     { label: 'Acceptée',     cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  refusee:      { label: 'Refusée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  annulee:      { label: 'Annulée',      cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
}

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', ski: 'Ski', seminaire: 'Séminaire',
  sportif: 'Sportif', autre: 'Autre',
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function Badge({ statut, meta }: { statut: string; meta: Record<string, { label: string; cls: string }> }) {
  const m = meta[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }
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
  sub,
  badge,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
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
      {sub && <p className="text-xs text-white/50 mt-2 truncate">{sub}</p>}
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

// ─── Lignes sections ─────────────────────────────────────────────────────────

function ReservationEtabRow({ r }: { r: ReservationEtab }) {
  return (
    <Link
      href={`/etablissement/reservations/${r.id}`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">
          {r.bde?.nom ?? '—'}
          {r.bde?.ecole && (
            <span className="text-gray-400 font-normal"> · {r.bde.ecole}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
          {' · '}{r.nb_participants} participant{r.nb_participants > 1 ? 's' : ''}
        </p>
      </div>
      <Badge statut={r.statut} meta={RES_STATUS} />
    </Link>
  )
}

function DemandeRow({ d }: { d: DemandeRecente }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">
          {d.bde?.nom ?? '—'}
          {d.bde?.ecole && (
            <span className="text-gray-400 font-normal"> · {d.bde.ecole}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {TYPE_LABELS[d.type_evenement] ?? d.type_evenement}
          {' · '}{fmtDate(d.date_debut)} → {fmtDate(d.date_fin)}
        </p>
      </div>
      <Badge statut={d.statut} meta={DEMANDE_STATUS} />
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function InboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}
function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function TrendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
function PercentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EtablissementDashboardPage() {
  const result = await getDashboardEtablissement()

  if (result.error || !result.data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">
        {result.error ?? 'Erreur chargement du dashboard.'}
      </div>
    )
  }

  const d = result.data

  return (
    <div className="flex flex-col gap-5">
      <FadeUp delay={0}>
        <div>
          <h1 className="text-lg font-bold text-navy">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue d&apos;ensemble de votre activité</p>
        </div>
      </FadeUp>

      {/* KPIs */}
      <FadeUp delay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<InboxIcon />}
          label="Demandes reçues"
          value={String(d.demandesRecues)}
          gradient="bg-navy"
        />
        <KpiCard
          icon={<CheckCircleIcon />}
          label="Réservations confirmées"
          value={String(d.reservationsConfirmees)}
          gradient="bg-brand"
        />
        <KpiCard
          icon={<TrendingIcon />}
          label="Revenus nets générés"
          value={fmt(d.revenusNets)}
          gradient="bg-emerald-600"
        />
        <KpiCard
          icon={<PercentIcon />}
          label="Taux d'occupation"
          value={`${d.tauxOccupation}%`}
          gradient="bg-violet-600"
        />
      </FadeUp>

      {/* Graphique */}
      <FadeUp delay={0.15}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-navy mb-6">Revenus mensuels</h3>
          <RevenusChart data={d.revenusParMois} />
        </div>
      </FadeUp>

      {/* Sections (2 colonnes sur grand écran) */}
      <FadeUp delay={0.2} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Dernières demandes */}
        <SectionCard title="Dernières demandes">
          {d.recentDemandes.length === 0 ? (
            <EmptyRow text="Aucune demande." />
          ) : (
            d.recentDemandes.map((dv) => <DemandeRow key={dv.id} d={dv} />)
          )}
        </SectionCard>

        {/* Prochaines réservations */}
        <SectionCard
          title="Prochaines réservations"
          href="/etablissement/reservations"
          linkLabel="Voir toutes →"
        >
          {d.prochainesReservations.length === 0 ? (
            <EmptyRow text="Aucune réservation à venir." />
          ) : (
            d.prochainesReservations.map((r) => <ReservationEtabRow key={r.id} r={r} />)
          )}
        </SectionCard>
      </FadeUp>
    </div>
  )
}

import Link from 'next/link'
import { FadeUp } from '@/components/shared/fade-up'
import { getDashboardBde } from '@/lib/actions/dashboard'
import type { EvenementRecent } from '@/lib/actions/dashboard'
import { InscriptionsChart } from './inscriptions-chart'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', ski: 'Ski', seminaire: 'Séminaire',
  sportif: 'Sportif', autre: 'Autre',
}

const EVT_STATUS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  publie:    { label: 'Publié',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  complet:   { label: 'Complet',   cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  termine:   { label: 'Terminé',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  annule:    { label: 'Annulé',    cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
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
  href: string
  linkLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        <Link href={href} className="text-xs text-brand hover:text-brand-light font-medium transition-colors">
          {linkLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-6 py-8 text-sm text-center text-gray-400">{text}</p>
  )
}

// ─── Lignes sections ─────────────────────────────────────────────────────────

function EvenementRow({ e }: { e: EvenementRecent }) {
  return (
    <Link
      href={`/bde/evenements/${e.id}`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">{e.nom}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {TYPE_LABELS[e.type] ?? e.type}
          {e.date_debut && ` · ${fmtDate(e.date_debut)}`}
          {' · '}{e.nb_inscrits} inscrit{e.nb_inscrits > 1 ? 's' : ''}
        </p>
      </div>
      <Badge statut={e.statut} meta={EVT_STATUS} />
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
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BdeDashboardPage() {
  const result = await getDashboardBde()

  if (result.error || !result.data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">
        {result.error ?? 'Erreur chargement du dashboard.'}
      </div>
    )
  }

  const d = result.data

  const prochaineDate = d.prochaineReservation
    ? fmtDate(d.prochaineReservation.date_debut)
    : '—'
  const prochaineLieu = d.prochaineReservation?.etablissement?.nom ?? undefined

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
          icon={<CalendarIcon />}
          label="Événements en cours"
          value={String(d.evenementsEnCours)}
          gradient="bg-navy"
        />
        <KpiCard
          icon={<ClockIcon />}
          label="Prochaine date"
          value={prochaineDate}
          sub={prochaineLieu}
          gradient="bg-brand"
        />
        <KpiCard
          icon={<UsersIcon />}
          label="Inscriptions totales"
          value={String(d.inscriptionsTotal)}
          gradient="bg-emerald-600"
        />
        <KpiCard
          icon={<EuroIcon />}
          label="Montant total dépensé"
          value={fmt(d.montantTotalDepense)}
          gradient="bg-violet-600"
        />
      </FadeUp>

      {/* Graphique */}
      <FadeUp delay={0.15}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-navy mb-6">Évolution des inscriptions</h3>
          <InscriptionsChart data={d.inscriptionsParMois} />
        </div>
      </FadeUp>

      {/* Sections (2 colonnes sur grand écran) */}
      <FadeUp delay={0.2} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Événements récents */}
        <SectionCard title="Événements récents" href="/bde/evenements" linkLabel="Voir tous →">
          {d.recentEvenements.length === 0 ? (
            <EmptyRow text="Aucun événement." />
          ) : (
            d.recentEvenements.map((e) => <EvenementRow key={e.id} e={e} />)
          )}
        </SectionCard>

        {/* Prochains événements */}
        <SectionCard title="Prochains événements" href="/bde/evenements" linkLabel="Voir tous →">
          {d.prochainsEvenements.length === 0 ? (
            <EmptyRow text="Aucun événement à venir." />
          ) : (
            d.prochainsEvenements.map((e) => <EvenementRow key={e.id} e={e} />)
          )}
        </SectionCard>
      </FadeUp>
    </div>
  )
}

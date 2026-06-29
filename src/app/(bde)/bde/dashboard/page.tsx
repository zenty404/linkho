import Link from 'next/link'
import { getDashboardBde } from '@/lib/actions/dashboard'
import type {
  ReservationRecente,
  DevisRecentBde,
  EvenementRecent,
} from '@/lib/actions/dashboard'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', voyage: 'Voyage',
  sportif: 'Sportif', culturel: 'Culturel', conference: 'Conférence',
  atelier: 'Atelier', autre: 'Autre',
}

const RES_STATUS: Record<string, { label: string; cls: string }> = {
  devis_signe:      { label: 'Devis signé',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  acompte_confirme: { label: 'Acompte reçu', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  confirmee:        { label: 'Confirmée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  en_cours:         { label: 'En cours',     cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  terminee:         { label: 'Terminée',     cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  annulee:          { label: 'Annulée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const DEVIS_STATUS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  envoye:    { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  accepte:   { label: 'Accepté',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  refuse:    { label: 'Refusé',   cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  signe:     { label: 'Signé',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
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
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: 'navy' | 'brand' | 'blue' | 'green'
}) {
  const colors = {
    navy: 'bg-navy text-white',
    brand: 'bg-brand text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-emerald-500 text-white',
  }
  return (
    <div className={`rounded-2xl p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-sm opacity-70 mt-1 truncate">{sub}</p>}
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

function ReservationRow({ r }: { r: ReservationRecente }) {
  return (
    <Link
      href={`/bde/reservations/${r.id}`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy truncate">
          {r.etablissement?.nom ?? '—'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDate(r.date_debut)} → {fmtDate(r.date_fin)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-navy tabular-nums">{fmt(r.montant_ttc)}</span>
        <Badge statut={r.statut} meta={RES_STATUS} />
      </div>
    </Link>
  )
}

function DevisBdeRow({ d }: { d: DevisRecentBde }) {
  const montant = d.total_ttc ?? d.sous_total_ht
  return (
    <Link
      href={`/bde/devis/${d.id}`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy font-mono">{d.numero}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{d.etablissement?.nom ?? '—'}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-navy tabular-nums">{fmt(montant)}</span>
        <Badge statut={d.statut} meta={DEVIS_STATUS} />
      </div>
    </Link>
  )
}

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
        </p>
      </div>
      <span className="text-xs font-medium text-gray-500 shrink-0 tabular-nums">
        {e.nb_inscrits} inscrit{e.nb_inscrits > 1 ? 's' : ''}
      </span>
    </Link>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
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
      <div>
        <h1 className="text-lg font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<CalendarIcon />}
          label="Réservations en cours"
          value={String(d.reservationsEnCours)}
          color="navy"
        />
        <KpiCard
          icon={<FileIcon />}
          label="Devis en attente"
          value={String(d.devisEnAttente)}
          color="brand"
        />
        <KpiCard
          icon={<ClockIcon />}
          label="Prochaine réservation"
          value={prochaineDate}
          sub={prochaineLieu}
          color="blue"
        />
        <KpiCard
          icon={<UsersIcon />}
          label="Inscriptions totales"
          value={String(d.inscriptionsTotal)}
          color="green"
        />
      </div>

      {/* Sections (2 colonnes sur grand écran) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Réservations récentes */}
        <SectionCard title="Réservations récentes" href="/bde/reservations">
          {d.recentReservations.length === 0 ? (
            <EmptyRow text="Aucune réservation." />
          ) : (
            d.recentReservations.map((r) => <ReservationRow key={r.id} r={r} />)
          )}
        </SectionCard>

        {/* Devis récents */}
        <SectionCard title="Devis récents" href="/bde/devis">
          {d.recentDevis.length === 0 ? (
            <EmptyRow text="Aucun devis." />
          ) : (
            d.recentDevis.map((dv) => <DevisBdeRow key={dv.id} d={dv} />)
          )}
        </SectionCard>
      </div>

      {/* Événements */}
      <SectionCard title="Mes événements" href="/bde/evenements" linkLabel="Voir tous les événements →">
        {d.recentEvenements.length === 0 ? (
          <EmptyRow text="Aucun événement." />
        ) : (
          d.recentEvenements.map((e) => <EvenementRow key={e.id} e={e} />)
        )}
      </SectionCard>
    </div>
  )
}

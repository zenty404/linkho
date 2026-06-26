import Link from 'next/link'
import { getDashboardEtablissement } from '@/lib/actions/dashboard'
import type {
  ReservationEtab,
  DevisRecentEtab,
  PaiementAConfirmer,
} from '@/lib/actions/dashboard'

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
  annulee:          { label: 'Annulée',      cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const DEVIS_STATUS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  envoye:    { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  accepte:   { label: 'Accepté',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  refuse:    { label: 'Refusé',   cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
  signe:     { label: 'Signé',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
}

const PAIEMENT_TYPE: Record<string, string> = {
  acompte:    'Acompte',
  solde:      'Solde',
  commission: 'Commission',
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
  iconCls,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  iconCls: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconCls}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-navy tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

function DevisEtabRow({ d }: { d: DevisRecentEtab }) {
  const montant = d.total_ttc ?? d.sous_total_ht
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy font-mono">{d.numero}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{d.bde?.nom ?? '—'}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-navy tabular-nums">{fmt(montant)}</span>
        <Badge statut={d.statut} meta={DEVIS_STATUS} />
      </div>
    </div>
  )
}

function PaiementRow({ p }: { p: PaiementAConfirmer }) {
  return (
    <Link
      href={`/etablissement/reservations/${p.reservation_id}`}
      className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy">
          {PAIEMENT_TYPE[p.type] ?? p.type}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{p.reference_virement}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-navy tabular-nums">{fmt(p.montant)}</span>
        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 rounded-full">
          En attente
        </span>
      </div>
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
function TrendingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
      <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
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
          iconCls="bg-navy"
        />
        <KpiCard
          icon={<FileIcon />}
          label="Devis en attente"
          value={String(d.devisEnAttente)}
          iconCls="bg-brand"
        />
        <KpiCard
          icon={<TrendingIcon />}
          label="Chiffre d'affaires"
          value={fmt(d.chiffreAffairesTotal)}
          sub="réservations terminées"
          iconCls="bg-emerald-500"
        />
        <KpiCard
          icon={<CreditCardIcon />}
          label="Paiements en attente"
          value={String(d.paiementsEnAttente)}
          iconCls="bg-amber-500"
        />
      </div>

      {/* Sections (2 colonnes sur grand écran) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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

        {/* Devis récents */}
        <SectionCard title="Devis récents">
          {d.recentDevis.length === 0 ? (
            <EmptyRow text="Aucun devis." />
          ) : (
            d.recentDevis.map((dv) => <DevisEtabRow key={dv.id} d={dv} />)
          )}
        </SectionCard>
      </div>

      {/* Paiements à confirmer */}
      <SectionCard
        title="Paiements à confirmer"
        href="/etablissement/reservations"
        linkLabel="Voir tout →"
      >
        {d.paiementsAConfirmer.length === 0 ? (
          <EmptyRow text="Aucun paiement en attente." />
        ) : (
          d.paiementsAConfirmer.map((p) => <PaiementRow key={p.id} p={p} />)
        )}
      </SectionCard>
    </div>
  )
}

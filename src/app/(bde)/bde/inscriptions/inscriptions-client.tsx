'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/types/supabase'
import type { InscriptionWithDetails } from '@/lib/actions/inscriptions'
import { marquerPayeTotal, marquerCautionRecue } from '@/lib/actions/inscriptions'

type Evenement = Database['public']['Tables']['evenements']['Row']

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  validee:    { label: 'Validée',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  annulee:    { label: 'Annulée',    cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200' },
}

const PAIEMENT_META: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'Non payé',  cls: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200' },
  partiel:    { label: 'Partiel',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  paye_total: { label: 'Payé',      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
]

const PAGE_SIZES = [10, 25, 50]

const COLS = 'auto 1fr 160px 170px 90px 80px 110px 110px 44px'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  const sum = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

// ─── Sous-composants ─────────────────────────────────────────────────────────

function CounterCard({
  label,
  value,
  sub,
  colorCls,
}: {
  label: string
  value: string
  sub?: string
  colorCls: string
}) {
  return (
    <div className={`rounded-xl px-5 py-4 ${colorCls}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function Badge({
  statut,
  meta,
}: {
  statut: string
  meta: Record<string, { label: string; cls: string }>
}) {
  const m = meta[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  evenements: Evenement[]
  inscriptions: InscriptionWithDetails[]
  evenementId: string | null
  evenement: Evenement | null
  formulaireId: string | null
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function InscriptionsClient({
  evenements,
  inscriptions,
  evenementId,
  evenement,
  formulaireId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState('')
  const [filtreCaution, setFiltreCaution] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return inscriptions.filter((i) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !i.nom.toLowerCase().includes(q) &&
          !i.prenom.toLowerCase().includes(q) &&
          !i.email.toLowerCase().includes(q)
        )
          return false
      }
      if (filtreStatut && i.statut !== filtreStatut) return false
      if (filtreStatutPaiement && i.statut_paiement !== filtreStatutPaiement) return false
      if (filtreCaution === 'oui' && !i.caution_payee) return false
      if (filtreCaution === 'non' && i.caution_payee) return false
      return true
    })
  }, [inscriptions, search, filtreStatut, filtreStatutPaiement, filtreCaution])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safeCurrentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)

  const total = inscriptions.length
  const validees = inscriptions.filter((i) => i.statut === 'validee').length
  const enAttentePaiement = inscriptions.filter(
    (i) => i.statut_paiement === 'en_attente' || i.statut_paiement === 'partiel',
  ).length
  const annulees = inscriptions.filter((i) => i.statut === 'annulee').length

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  function handleExport() {
    if (filtered.length === 0) return
    const headers = [
      'Prénom', 'Nom', 'Email', 'Statut', 'Statut paiement',
      'Caution payée', 'Montant total', 'Date inscription',
    ]
    const rows = filtered.map((i) => [
      i.prenom, i.nom, i.email, i.statut, i.statut_paiement,
      i.caution_payee ? 'Oui' : 'Non',
      i.montant_total.toFixed(2),
      fmtDate(i.created_at),
    ])
    const csv =
      '﻿' +
      [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inscriptions-${evenementId ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">Inscriptions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {evenement ? evenement.nom : 'Sélectionnez un événement'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {evenementId && (
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-navy border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <DownloadIcon />
              Exporter (Excel)
            </button>
          )}
          {formulaireId ? (
            <a
              href={`/inscription/${formulaireId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <span className="text-base leading-none">+</span>
              Ajouter une inscription
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Aucun formulaire publié pour cet événement"
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed"
            >
              <span className="text-base leading-none">+</span>
              Ajouter une inscription
            </button>
          )}
        </div>
      </div>

      {/* Sélecteur d'événement */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-500 shrink-0">Événement</label>
          <select
            value={evenementId ?? ''}
            onChange={(e) => {
              if (e.target.value) {
                router.push(`/bde/inscriptions?evenement_id=${e.target.value}`)
              }
            }}
            className="flex-1 text-sm text-navy bg-transparent border-0 outline-none cursor-pointer min-w-0"
          >
            <option value="">— Choisir un événement —</option>
            {evenements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenu conditionnel */}
      {!evenementId && evenements.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-sm text-gray-400">
            Aucun événement.{' '}
            <Link href="/bde/evenements/nouveau" className="text-brand hover:underline font-medium">
              Créez votre premier événement
            </Link>
          </p>
        </div>
      )}

      {evenementId && (
        <>
          {/* Cards compteurs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CounterCard
              label="Inscrits"
              value={String(total)}
              sub={evenement?.nb_places_max ? `/ ${evenement.nb_places_max} places` : undefined}
              colorCls="bg-navy text-white"
            />
            <CounterCard
              label="Validées"
              value={`${pct(validees)}%`}
              sub={`${validees} inscription${validees > 1 ? 's' : ''}`}
              colorCls="bg-emerald-50 text-emerald-800"
            />
            <CounterCard
              label="En att. paiement"
              value={`${pct(enAttentePaiement)}%`}
              sub={`${enAttentePaiement} inscription${enAttentePaiement > 1 ? 's' : ''}`}
              colorCls="bg-amber-50 text-amber-800"
            />
            <CounterCard
              label="Annulées"
              value={`${pct(annulees)}%`}
              sub={`${annulees} inscription${annulees > 1 ? 's' : ''}`}
              colorCls="bg-red-50 text-red-800"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg flex-1 min-w-56">
              <SearchIcon />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-gray-300 hover:text-gray-500 text-xs leading-none"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={filtreStatut}
              onChange={(e) => {
                setFiltreStatut(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
            <select
              value={filtreStatutPaiement}
              onChange={(e) => {
                setFiltreStatutPaiement(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
            >
              <option value="">Tous paiements</option>
              <option value="en_attente">Non payé</option>
              <option value="partiel">Partiel</option>
              <option value="paye">Payé</option>
            </select>
            <select
              value={filtreCaution}
              onChange={(e) => {
                setFiltreCaution(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
            >
              <option value="">Caution (tous)</option>
              <option value="oui">Caution payée</option>
              <option value="non">Caution non payée</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className="grid gap-x-4 px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100"
              style={{ gridTemplateColumns: COLS }}
            >
              <span />
              <span>Nom / Email</span>
              <span>Statut</span>
              <span>Paiement</span>
              <span className="text-center">Versements</span>
              <span className="text-center">Caution</span>
              <span className="text-right">Montant</span>
              <span>Inscrit le</span>
              <span />
            </div>

            {paginated.length === 0 ? (
              <p className="px-4 py-14 text-center text-sm text-gray-400">
                {filtered.length === 0 && inscriptions.length > 0
                  ? 'Aucune inscription ne correspond aux filtres.'
                  : 'Aucune inscription pour cet événement.'}
              </p>
            ) : (
              paginated.map((i) => {
                const initials =
                  `${i.prenom[0] ?? ''}${i.nom[0] ?? ''}`.toUpperCase()
                const payeCount = i.echeances.filter((e) => e.paye).length
                const totalEch = i.echeances.length

                return (
                  <div
                    key={i.id}
                    className="grid gap-x-4 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors items-center"
                    style={{ gridTemplateColumns: COLS }}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(i.prenom + i.nom)}`}
                    >
                      {initials}
                    </div>

                    {/* Nom + email */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">
                        {i.prenom} {i.nom}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{i.email}</p>
                    </div>

                    {/* Statut */}
                    <Badge statut={i.statut} meta={STATUT_META} />

                    {/* Paiement */}
                    {i.statut_paiement === 'paye_total' ? (
                      <Badge statut="paye_total" meta={PAIEMENT_META} />
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await marquerPayeTotal(i.id)
                            router.refresh()
                          })
                        }
                        className="px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-40"
                      >
                        Marquer payé
                      </button>
                    )}

                    {/* Versements */}
                    <span className="text-xs text-center text-gray-500 tabular-nums">
                      {totalEch > 0 ? `${payeCount}/${totalEch}` : '—'}
                    </span>

                    {/* Caution */}
                    <div className="flex justify-center">
                      {i.caution_montant ? (
                        i.caution_payee ? (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 rounded-full">
                            Reçue
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                await marquerCautionRecue(i.id)
                                router.refresh()
                              })
                            }
                            className="px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-40"
                          >
                            ✓ Reçue
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                    {/* Montant */}
                    <span className="text-sm font-medium text-navy tabular-nums text-right">
                      {fmt(i.montant_total)}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-gray-400">{fmtDate(i.created_at)}</span>

                    {/* Action */}
                    <Link
                      href={`/bde/inscriptions/${i.id}`}
                      className="flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors"
                      title="Voir le détail"
                    >
                      <ArrowRightIcon />
                    </Link>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Lignes par page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md outline-none"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>
                {filtered.length > 0
                  ? `${(safeCurrentPage - 1) * pageSize + 1}–${Math.min(safeCurrentPage * pageSize, filtered.length)} sur ${filtered.length}`
                  : '0 résultat'}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="ml-1 p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-gray-400 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

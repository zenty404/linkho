'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addDevisItem,
  updateDevisItem,
  deleteDevisItem,
  updateDevis,
  envoyerDevis,
} from '@/lib/actions/devis'
import type { DevisWithItems } from '@/lib/actions/devis'

// ─── Types locaux ────────────────────────────────────────────────────────────

type ItemState = {
  id: string
  libelle: string
  description: string | null
  quantite: number
  prix_unitaire: number
  ordre: number | null
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR')

const STATUS_META: Record<string, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
  envoye: { label: 'Envoyé', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
  signe: { label: 'Signé', cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-navy">{value}</p>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Props = { devis: DevisWithItems }

export function DevisEditor({ devis }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState<ItemState[]>(
    devis.items.map((i) => ({
      id: i.id,
      libelle: i.libelle,
      description: i.description,
      quantite: i.quantite,
      prix_unitaire: i.prix_unitaire,
      ordre: i.ordre,
    })),
  )
  const [message, setMessage] = useState(devis.message_client ?? '')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    libelle: '',
    description: '',
    quantite: 1,
    prix_unitaire: '' as string | number,
  })
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  const statut = devis.statut
  const isBrouillon = statut === 'brouillon'
  const statusMeta = STATUS_META[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' }

  // Totaux calculés depuis l'état local
  const sousTotal = items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0)
  const tvaTaux = devis.tva_taux
  const totalTtc = sousTotal * (1 + tvaTaux)
  const tvaMontant = totalTtc - sousTotal
  const acompteTaux = devis.acompte_taux
  const acompteMontant = totalTtc * acompteTaux
  const soldeMontant = totalTtc * (1 - acompteTaux)

  // ── Handlers items ──────────────────────────────────────────────────────

  const setItemField = (id: string, field: keyof ItemState, value: unknown) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    startTransition(async () => {
      const res = await deleteDevisItem(itemId)
      if (res.error) {
        setItems(devis.items)
        setFeedback({ type: 'error', msg: res.error })
      }
    })
  }

  const handleAddItem = () => {
    const libelle = String(newItem.libelle).trim()
    const prix = parseFloat(String(newItem.prix_unitaire))
    if (!libelle || isNaN(prix)) {
      setFeedback({ type: 'error', msg: 'Libellé et prix sont obligatoires.' })
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('libelle', libelle)
      fd.set('description', String(newItem.description ?? ''))
      fd.set('quantite', String(newItem.quantite))
      fd.set('prix_unitaire', String(prix))

      const res = await addDevisItem(devis.id, fd)
      if (res.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else if (res.data) {
        setItems((prev) => [
          ...prev,
          {
            id: res.data!.id,
            libelle: res.data!.libelle,
            description: res.data!.description,
            quantite: res.data!.quantite,
            prix_unitaire: res.data!.prix_unitaire,
            ordre: res.data!.ordre,
          },
        ])
        setNewItem({ libelle: '', description: '', quantite: 1, prix_unitaire: '' })
        setShowAddForm(false)
        router.refresh()
      }
    })
  }

  // ── Save ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setFeedback(null)
    startTransition(async () => {
      for (const item of items) {
        const fd = new FormData()
        fd.set('libelle', item.libelle)
        fd.set('description', item.description ?? '')
        fd.set('quantite', String(item.quantite))
        fd.set('prix_unitaire', String(item.prix_unitaire))
        const res = await updateDevisItem(item.id, fd)
        if (res.error) {
          setFeedback({ type: 'error', msg: `"${item.libelle}" : ${res.error}` })
          return
        }
      }

      const fd = new FormData()
      fd.set('message_client', message)
      fd.set('sous_total_ht', String(sousTotal))
      const res = await updateDevis(devis.id, fd)

      if (res.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        setFeedback({ type: 'ok', msg: 'Devis enregistré.' })
        router.refresh()
      }
    })
  }

  // ── Envoyer ─────────────────────────────────────────────────────────────

  const handleEnvoyer = () => {
    if (items.length === 0) {
      setFeedback({ type: 'error', msg: 'Ajoutez au moins une prestation avant d\'envoyer.' })
      return
    }
    startTransition(async () => {
      const res = await envoyerDevis(devis.id)
      if (res.error) {
        setFeedback({ type: 'error', msg: res.error })
      } else {
        router.refresh()
      }
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 items-start">
      {/* ── Colonne gauche ── */}
      <div className="flex-[7] min-w-0 flex flex-col gap-4">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-navy font-mono">
                {devis.numero || '(numéro en attente)'}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Fonctionnalité à venir"
              >
                Dupliquer
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Fonctionnalité à venir"
              >
                Aperçu PDF
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={handleEnvoyer}
                disabled={!isBrouillon || isPending}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-navy rounded-lg hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Envoyer au BDE
              </button>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {feedback.msg}
            </div>
          )}
        </div>

        {/* Informations générales */}
        <SectionCard title="Informations générales">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <InfoField
              label="BDE"
              value={devis.demande.bde?.nom ?? devis.demande.bde_id}
            />
            <InfoField
              label="École"
              value={devis.demande.bde?.ecole ?? '—'}
            />
            <InfoField
              label="Dates de l'événement"
              value={`${fmtDate(devis.date_evenement_debut)} → ${fmtDate(devis.date_evenement_fin)}`}
            />
            <InfoField
              label="Participants"
              value={String(devis.nb_participants)}
            />
          </div>
        </SectionCard>

        {/* Prestations */}
        <SectionCard title="Prestations incluses">
          {/* En-tête colonnes */}
          <div
            className="grid gap-x-4 text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 border-b border-gray-100"
            style={{ gridTemplateColumns: 'minmax(0,1fr) 108px 140px 110px 32px' }}
          >
            <span>Prestation</span>
            <span className="text-center">Quantité</span>
            <span className="text-right">Prix unitaire HT</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>

          {/* Lignes */}
          {items.length === 0 && !showAddForm && (
            <p className="py-6 text-center text-sm text-gray-400">
              Aucune prestation. Ajoutez-en une ci-dessous.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-x-4 py-3.5 border-b border-gray-50 last:border-0 items-start"
              style={{ gridTemplateColumns: 'minmax(0,1fr) 108px 140px 110px 32px' }}
            >
              {/* Libellé + description */}
              <div>
                <input
                  value={item.libelle}
                  onChange={(e) => setItemField(item.id, 'libelle', e.target.value)}
                  disabled={!isBrouillon}
                  placeholder="Libellé de la prestation"
                  className="w-full text-sm font-medium text-navy bg-transparent border-b border-transparent focus:border-brand focus:outline-none pb-0.5 disabled:cursor-default"
                />
                <input
                  value={item.description ?? ''}
                  onChange={(e) => setItemField(item.id, 'description', e.target.value || null)}
                  disabled={!isBrouillon}
                  placeholder="Description (optionnel)"
                  className="w-full text-xs text-gray-400 mt-1 bg-transparent border-b border-transparent focus:border-brand/50 focus:outline-none pb-0.5 disabled:cursor-default"
                />
              </div>

              {/* Quantité */}
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  disabled={!isBrouillon || item.quantite <= 1}
                  onClick={() => setItemField(item.id, 'quantite', item.quantite - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-navy tabular-nums">
                  {item.quantite}
                </span>
                <button
                  type="button"
                  disabled={!isBrouillon}
                  onClick={() => setItemField(item.id, 'quantite', item.quantite + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                >
                  +
                </button>
              </div>

              {/* Prix unitaire */}
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  value={item.prix_unitaire}
                  onChange={(e) =>
                    setItemField(item.id, 'prix_unitaire', parseFloat(e.target.value) || 0)
                  }
                  disabled={!isBrouillon}
                  step="0.01"
                  min="0"
                  className="w-full text-sm text-right bg-transparent border-b border-transparent focus:border-brand focus:outline-none pb-0.5 tabular-nums disabled:cursor-default"
                />
                <span className="text-xs text-gray-400 shrink-0">€</span>
              </div>

              {/* Total ligne */}
              <p className="text-sm font-semibold text-navy text-right mt-0.5 tabular-nums">
                {fmt(item.quantite * item.prix_unitaire)}
              </p>

              {/* Supprimer */}
              <button
                type="button"
                disabled={!isBrouillon || isPending}
                onClick={() => handleDeleteItem(item.id)}
                className="mt-0.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-lg leading-none"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}

          {/* Formulaire d'ajout */}
          {showAddForm && isBrouillon && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <div
                className="grid gap-x-4 gap-y-2 items-end"
                style={{ gridTemplateColumns: 'minmax(0,1fr) 108px 140px auto' }}
              >
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Libellé *</label>
                  <input
                    value={newItem.libelle}
                    onChange={(e) => setNewItem((p) => ({ ...p, libelle: e.target.value }))}
                    placeholder="Location de salle"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    autoFocus
                  />
                  <input
                    value={newItem.description}
                    onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optionnel)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 mt-1.5 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Qté *</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantite}
                    onChange={(e) => setNewItem((p) => ({ ...p, quantite: parseInt(e.target.value) || 1 }))}
                    className="w-full text-sm text-center border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Prix unitaire HT (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.prix_unitaire}
                    onChange={(e) => setNewItem((p) => ({ ...p, prix_unitaire: e.target.value }))}
                    placeholder="0.00"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-lg transition-colors disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bouton ajouter */}
          {isBrouillon && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition-colors"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-brand/10 text-brand text-base leading-none">
                +
              </span>
              Ajouter une prestation
            </button>
          )}
        </SectionCard>

        {/* Message au client */}
        <SectionCard title="Message au client">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isBrouillon}
            rows={4}
            placeholder="Informations complémentaires, conditions particulières, remarques…"
            className="w-full text-sm text-gray-700 placeholder:text-gray-400 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-default"
          />
        </SectionCard>
      </div>

      {/* ── Colonne droite — sticky ── */}
      <div className="w-72 shrink-0">
        <div className="sticky top-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Récapitulatif
            </h2>
          </div>

          <div className="px-5 py-5 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Sous-total HT</span>
              <span className="font-medium text-navy tabular-nums">{fmt(sousTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">TVA {Math.round(tvaTaux * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(tvaMontant)}</span>
            </div>

            <div className="!mt-4 pt-4 border-t border-gray-100 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-navy">Total TTC</span>
              <span className="text-2xl font-bold text-brand tabular-nums">{fmt(totalTtc)}</span>
            </div>
          </div>

          <div className="px-5 pb-5 pt-1 space-y-2.5 text-sm border-t border-gray-50">
            <div className="flex justify-between items-center pt-3">
              <span className="text-gray-500">Acompte {Math.round(acompteTaux * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(acompteMontant)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1.5">À régler à la signature</p>

            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500">Solde {Math.round((1 - acompteTaux) * 100)}%</span>
              <span className="font-medium text-navy tabular-nums">{fmt(soldeMontant)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1.5">À régler après l'événement</p>
          </div>

          {message && (
            <div className="px-5 pb-4 pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 mb-1.5">Message</p>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{message}</p>
            </div>
          )}

          <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-2">
            <button
              type="button"
              className="w-full px-4 py-2.5 text-sm font-medium text-navy border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Fonctionnalité à venir"
            >
              Aperçu du devis
            </button>
            <button
              type="button"
              onClick={handleEnvoyer}
              disabled={!isBrouillon || isPending}
              className="w-full px-4 py-2.5 text-sm font-bold text-white bg-navy rounded-lg hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Envoi en cours…' : 'Envoyer au BDE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

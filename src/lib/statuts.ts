export type BadgeStyle = { label: string; cls: string }

// ── Réservations ─────────────────────────────────────────────────────────────
export const RESERVATION_STATUTS: Record<string, BadgeStyle> = {
  en_attente_acompte:   { label: 'Acompte à régler',    cls: 'bg-amber-100 text-amber-700' },
  acompte_confirme:     { label: 'Acompte payé',         cls: 'bg-blue-100 text-blue-700' },
  confirmee:            { label: 'Solde à régler',       cls: 'bg-orange-100 text-orange-700' },
  en_cours:             { label: 'Événement terminé',    cls: 'bg-green-100 text-green-700' },
  terminee:             { label: 'Clôturé',              cls: 'bg-gray-100 text-gray-600' },
  commission_reversee:  { label: 'Clôturé',              cls: 'bg-gray-100 text-gray-600' },
  annulee:              { label: 'Annulée',              cls: 'bg-red-100 text-red-700' },
  devis_signe:          { label: 'Réservé',              cls: 'bg-blue-100 text-blue-700' },
}

// ── Demandes ─────────────────────────────────────────────────────────────────
export const DEMANDE_STATUTS: Record<string, BadgeStyle> = {
  en_attente:           { label: 'En attente',           cls: 'bg-amber-100 text-amber-700' },
  disponible:           { label: 'Disponible',           cls: 'bg-green-100 text-green-700' },
  non_disponible:       { label: 'Non disponible',       cls: 'bg-red-100 text-red-700' },
  refusee:              { label: 'Refusée',              cls: 'bg-red-100 text-red-700' },
  validee:              { label: 'Validée',              cls: 'bg-green-100 text-green-700' },
}

// ── Solde ─────────────────────────────────────────────────────────────────────
export const SOLDE_STATUTS: Record<string, BadgeStyle> = {
  en_attente:           { label: 'Solde en attente',     cls: 'bg-amber-100 text-amber-700' },
  paye:                 { label: 'Solde payé',           cls: 'bg-green-100 text-green-700' },
}

// ── Helper ────────────────────────────────────────────────────────────────────
export function getBadge(
  statut: string | null | undefined,
  map: Record<string, BadgeStyle>,
  fallback?: string,
): BadgeStyle {
  if (!statut) return { label: fallback ?? '—', cls: 'bg-gray-100 text-gray-500' }
  return map[statut] ?? { label: fallback ?? statut, cls: 'bg-gray-100 text-gray-500' }
}

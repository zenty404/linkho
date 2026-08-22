const MONTH_LABELS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
]

export type MonthBucket = { key: string; label: string; start: Date }

/** Les `count` derniers mois (mois courant inclus), du plus ancien au plus récent. */
export function getLastMonths(count: number): MonthBucket[] {
  const now = new Date()
  const buckets: MonthBucket[] = []
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: MONTH_LABELS_FR[start.getMonth()],
      start,
    })
  }
  return buckets
}

export function monthKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

import { getLieuxPublics } from '@/lib/actions/public'
import RecherchePage from './rechercher-client'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const ville = typeof sp.ville === 'string' ? sp.ville : ''
  const participants = typeof sp.participants === 'string' ? sp.participants : ''
  const budget_max_str = typeof sp.budget_max === 'string' ? sp.budget_max : ''
  const avec_hebergement = sp.avec_hebergement === 'true'
  const date_debut = typeof sp.date_debut === 'string' ? sp.date_debut : ''
  const date_fin = typeof sp.date_fin === 'string' ? sp.date_fin : ''

  const equipements: string[] = Array.isArray(sp.equipements)
    ? (sp.equipements as string[])
    : typeof sp.equipements === 'string'
      ? [sp.equipements]
      : []

  const types_evenements: string[] = Array.isArray(sp.types_evenements)
    ? (sp.types_evenements as string[])
    : typeof sp.types_evenements === 'string'
      ? [sp.types_evenements]
      : []

  const result = await getLieuxPublics({
    ville: ville || undefined,
    capacite_min: participants ? parseInt(participants, 10) : undefined,
    budget_max: budget_max_str ? parseInt(budget_max_str, 10) : undefined,
    tags_equipements: equipements.length > 0 ? equipements : undefined,
    types_evenements: types_evenements.length > 0 ? types_evenements : undefined,
    avec_hebergement: avec_hebergement || undefined,
    date_debut: date_debut || undefined,
    date_fin: date_fin || undefined,
  })

  return (
    <RecherchePage
      lieux={result.data ?? []}
      initialFiltres={{
        ville,
        participants,
        budget_max: budget_max_str,
        avec_hebergement,
        equipements,
        types_evenements,
      }}
      initialDates={{ date_debut, date_fin }}
    />
  )
}

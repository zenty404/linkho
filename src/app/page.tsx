import { createClient } from '@/lib/supabase/server'
import { getAvisLinkho } from '@/lib/actions/avis'
import HomeClient from './home-client'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: lieux }, avisResult] = await Promise.all([
    supabase
      .from('etablissement_profiles')
      .select('id, nom, ville, capacite_max, prix_base, etablissement_photos(url, est_principale)')
      .eq('actif', true)
      .eq('visible', true)
      .limit(6),
    getAvisLinkho(),
  ])

  type PhotoRow = { url: string; est_principale: boolean | null }
  type LieuRow = NonNullable<typeof lieux>[number]

  function getPhoto(lieu: LieuRow): string | null {
    const photos = lieu.etablissement_photos as PhotoRow[] | null
    if (!photos?.length) return null
    return photos.find((p) => p.est_principale)?.url ?? photos[0].url
  }

  const lieuxAffiches = (lieux ?? []).slice(0, 3).map((l) => ({
    id: l.id,
    nom: l.nom,
    ville: l.ville,
    capacite_max: l.capacite_max,
    prix_base: l.prix_base,
    photo: getPhoto(l),
  }))

  const heroPhotos = (lieux ?? [])
    .map((l) => getPhoto(l))
    .filter((p): p is string => p !== null)
    .slice(0, 4)

  const avisLinkho = (avisResult.data ?? []).slice(0, 3)

  return (
    <HomeClient
      heroPhotos={heroPhotos}
      lieuxAffiches={lieuxAffiches}
      avisLinkho={avisLinkho}
    />
  )
}

import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { etabNom: string }

export function DevisRefuseEmail({ etabNom }: Props) {
  return (
    <BaseLayout previewText={`Vous avez refusé le devis de ${etabNom}`}>
      <Text style={t.h1}>Devis refusé</Text>
      <Text style={t.body}>
        Vous avez refusé le devis de <strong>{etabNom}</strong>.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.body}>
        Pas d&apos;inquiétude — de nombreux établissements sont disponibles sur LINKHO.
        Parcourez notre catalogue pour trouver le lieu idéal pour votre événement.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/rechercher`} style={t.btn}>
          Rechercher un autre lieu
        </Button>
      </Section>
    </BaseLayout>
  )
}

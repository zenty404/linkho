import { Hr, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

type Props = {
  motif: string
}

export function CompteRefuseEmail({ motif }: Props) {
  return (
    <BaseLayout previewText="Votre demande d'accès LINKHO a été refusée">
      <Text style={t.h1}>Demande d&apos;accès refusée</Text>
      <Text style={t.body}>
        Nous avons examiné votre demande d&apos;accès à LINKHO et ne sommes pas en mesure
        de l&apos;approuver pour le moment.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Motif</Text>
      <Text style={t.value}>{motif}</Text>
      <Text style={t.muted}>
        Pour toute question ou recours, contactez-nous à{' '}
        <a href="mailto:support@linkho.fr" style={{ color: '#f49915' }}>support@linkho.fr</a>.
      </Text>
    </BaseLayout>
  )
}

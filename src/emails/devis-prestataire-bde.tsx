import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

const TYPE_LABELS: Record<string, string> = {
  transport: 'transport',
  securite: 'sécurité',
  autre: 'prestation',
}

type Props = {
  type: string
  nomPrestataire: string
  evenementId: string
}

export function DevisPrestataireBdeEmail({ type, nomPrestataire, evenementId }: Props) {
  const typeLabel = TYPE_LABELS[type] ?? type
  return (
    <BaseLayout previewText={`Nouveau devis ${typeLabel} disponible dans votre espace événement`}>
      <Text style={t.h1}>Nouveau devis disponible</Text>
      <Text style={t.body}>
        Un devis <strong>{typeLabel}</strong> a été déposé dans votre espace événement par{' '}
        <strong>{nomPrestataire}</strong>.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.muted}>
        Consultez-le et signez-le pour confirmer la prestation. Vous pouvez également le refuser si
        nécessaire.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Voir le devis
        </Button>
      </Section>
    </BaseLayout>
  )
}

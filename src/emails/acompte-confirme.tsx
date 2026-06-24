import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { evenementNom: string; montantAcompte: number; evenementId: string }

export function AcompteConfirmeEmail({ evenementNom, montantAcompte, evenementId }: Props) {
  return (
    <BaseLayout previewText={`Acompte confirmé — ${evenementNom}`}>
      <Text style={t.h1}>Acompte confirmé ✅</Text>
      <Text style={t.body}>
        Votre acompte de <strong>{fmtEuro(montantAcompte)}</strong> a bien été reçu pour{' '}
        <strong>{evenementNom}</strong>. Votre réservation est confirmée.
      </Text>
      <Hr style={t.divider} />
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Voir mon événement
        </Button>
      </Section>
    </BaseLayout>
  )
}

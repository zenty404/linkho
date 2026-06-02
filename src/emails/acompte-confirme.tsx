import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { evenementNom: string; montantAcompte: number; evenementId: string }

export function AcompteConfirmeEmail({ evenementNom, montantAcompte, evenementId }: Props) {
  return (
    <BaseLayout previewText="Votre acompte a été confirmé — facture disponible">
      <Text style={t.h1}>Acompte confirmé ✓</Text>
      <Text style={t.body}>
        Bonne nouvelle ! Votre acompte pour <strong>{evenementNom}</strong> a bien été reçu et confirmé.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Montant acompte</Text>
      <Text style={t.amount}>{fmtEuro(montantAcompte)}</Text>
      <Text style={t.muted}>
        Votre facture d&apos;acompte est disponible dans votre espace LINKHO.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Télécharger la facture
        </Button>
      </Section>
    </BaseLayout>
  )
}

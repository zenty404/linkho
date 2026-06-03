import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { evenementNom: string; montantSolde: number; evenementId: string }

export function SoldeConfirmeEmail({ evenementNom, montantSolde, evenementId }: Props) {
  return (
    <BaseLayout previewText="Votre solde a été confirmé — facture disponible">
      <Text style={t.h1}>Solde confirmé ✓</Text>
      <Text style={t.body}>
        Le solde de votre réservation pour <strong>{evenementNom}</strong> a bien été reçu et confirmé.
        Votre événement est désormais entièrement réglé.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Montant solde</Text>
      <Text style={t.amount}>{fmtEuro(montantSolde)}</Text>
      <Text style={t.muted}>
        Votre facture de solde est disponible dans votre espace LINKHO.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Télécharger la facture
        </Button>
      </Section>
    </BaseLayout>
  )
}

import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, fmtDate, t, BRAND, NAVY } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = {
  etabNom: string
  soldeMonant: number
  expireAt: string
  joursRestants: number
  evenementId: string
}

export function RappelSoldeBdeEmail({ etabNom, soldeMonant, expireAt, joursRestants, evenementId }: Props) {
  const urgence = joursRestants <= 1
  return (
    <BaseLayout previewText={`Rappel — Il vous reste ${joursRestants} jour${joursRestants > 1 ? 's' : ''} pour régler le solde`}>
      <Text style={t.h1}>Rappel — Solde à régler</Text>
      <Text style={t.body}>
        Le solde de votre réservation avec <strong>{etabNom}</strong> est à régler avant le{' '}
        <strong>{fmtDate(expireAt)}</strong>.
        {urgence ? " C'est demain — agissez maintenant." : ''}
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Jours restants</Text>
      <Text style={{ ...t.amount, color: urgence ? '#ef4444' : BRAND }}>
        {joursRestants} jour{joursRestants > 1 ? 's' : ''}
      </Text>
      <Text style={t.label}>Montant du solde</Text>
      <Text style={{ fontSize: '20px', fontWeight: '800', color: BRAND, margin: '0 0 16px 0' }}>
        {fmtEuro(soldeMonant)}
      </Text>
      <Text style={{ ...t.muted, color: urgence ? '#dc2626' : '#6b7280', fontWeight: urgence ? '600' : '400' }}>
        {urgence
          ? 'Attention : le délai expire demain. Tout retard peut entraîner une pénalité.'
          : 'Connectez-vous pour effectuer le virement et déposer votre justificatif.'}
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={{ ...t.btn, backgroundColor: urgence ? '#ef4444' : BRAND, color: urgence ? '#ffffff' : NAVY }}>
          Voir ma facture
        </Button>
      </Section>
    </BaseLayout>
  )
}

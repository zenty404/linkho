import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t, NAVY } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { montantCommission: number; demandeId: string }

export function RappelCommissionEmail({ montantCommission, demandeId }: Props) {
  return (
    <BaseLayout previewText="Rappel — Commission LINKHO à reverser">
      <Text style={t.h1}>Rappel : commission à reverser</Text>
      <Text style={t.body}>
        Le solde de votre réservation a été confirmé. Conformément aux conditions LINKHO,
        la commission est désormais due.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Montant commission</Text>
      <Text style={t.amount}>{fmtEuro(montantCommission)}</Text>
      <Text style={t.label}>IBAN LINKHO</Text>
      <Text style={{ ...t.value, fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '8px 12px', borderRadius: '4px', color: NAVY }}>
        [IBAN_LINKHO]
      </Text>
      <Text style={t.muted}>
        Merci d&apos;effectuer ce virement dans les meilleurs délais avec votre référence de réservation.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/etablissement/demandes/${demandeId}`} style={t.btn}>
          Voir la réservation
        </Button>
      </Section>
    </BaseLayout>
  )
}

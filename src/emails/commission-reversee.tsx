import { Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, fmtEuro, t } from './components/base-layout'

type Props = { etabNom: string; bdeNom: string; montantReservation: number; date: string }

export function CommissionReverseeEmail({ etabNom, bdeNom, montantReservation, date }: Props) {
  return (
    <BaseLayout previewText={`Commission reçue — ${etabNom}`}>
      <Text style={t.h1}>Commission reçue</Text>
      <Text style={t.body}>
        Une commission LINKHO a été reçue suite à la clôture d&apos;une réservation.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Établissement</Text>
      <Text style={t.value}>{etabNom}</Text>
      <Text style={t.label}>BDE</Text>
      <Text style={t.value}>{bdeNom}</Text>
      <Text style={t.label}>Montant réservation TTC</Text>
      <Text style={t.amount}>{fmtEuro(montantReservation)}</Text>
      <Text style={t.label}>Date</Text>
      <Text style={t.value}>{fmtDate(date)}</Text>
      <Section style={{ marginTop: '8px' }}>
        <Text style={t.muted}>
          Ce message est généré automatiquement par la plateforme LINKHO.
        </Text>
      </Section>
    </BaseLayout>
  )
}

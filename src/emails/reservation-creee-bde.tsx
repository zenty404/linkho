import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t, fmtEuro } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = {
  etabNom: string
  bdeNom: string
  dateDebut: string
  dateFin: string
  montantAcompte: number
  reservationId: string
}

export function ReservationCreeBdeEmail({
  etabNom, bdeNom, dateDebut, dateFin, montantAcompte, reservationId,
}: Props) {
  return (
    <BaseLayout previewText={`Réservation confirmée avec ${etabNom} — acompte à régler`}>
      <Text style={t.h1}>Réservation confirmée !</Text>
      <Text style={t.body}>
        Bonne nouvelle, <strong>{bdeNom}</strong> ! Votre réservation avec{' '}
        <strong>{etabNom}</strong> a été validée par l&apos;équipe LINKHO.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Dates</Text>
      <Text style={t.value}>{fmtDate(dateDebut)} → {fmtDate(dateFin)}</Text>
      <Text style={t.label}>Acompte à régler (30 %)</Text>
      <Text style={t.amount}>{fmtEuro(montantAcompte)}</Text>
      <Text style={t.muted}>
        Téléchargez votre facture d&apos;acompte et procédez au virement bancaire pour finaliser
        votre réservation.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/api/pdf/facture/${reservationId}/acompte`} style={t.btn}>
          Télécharger la facture d&apos;acompte
        </Button>
      </Section>
    </BaseLayout>
  )
}

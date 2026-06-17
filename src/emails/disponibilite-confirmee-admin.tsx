import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t, fmtEuro } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = {
  etabNom: string
  bdeNom: string
  ecole: string
  typeEvenement: string
  dateDebut: string
  dateFin: string
  nbParticipants: number
  montantPropose: number | null
}

export function DisponibiliteConfirmeeAdminEmail({
  etabNom, bdeNom, ecole, typeEvenement, dateDebut, dateFin, nbParticipants, montantPropose,
}: Props) {
  return (
    <BaseLayout previewText={`${etabNom} a confirmé sa disponibilité — validation requise`}>
      <Text style={t.h1}>Nouvelle disponibilité à valider</Text>
      <Text style={t.body}>
        <strong>{etabNom}</strong> a confirmé sa disponibilité pour la demande de{' '}
        <strong>{bdeNom}</strong> ({ecole}).
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Type d&apos;événement</Text>
      <Text style={t.value}>{typeEvenement}</Text>
      <Text style={t.label}>Dates</Text>
      <Text style={t.value}>{fmtDate(dateDebut)} → {fmtDate(dateFin)}</Text>
      <Text style={t.label}>Participants</Text>
      <Text style={t.value}>{nbParticipants} personnes</Text>
      {montantPropose != null && (
        <>
          <Text style={t.label}>Montant proposé (auto)</Text>
          <Text style={t.amount}>{fmtEuro(montantPropose)}</Text>
        </>
      )}
      <Text style={t.muted}>
        Validez le montant et générez la facture d&apos;acompte depuis le back-office.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/admin/reservations`} style={t.btn}>
          Valider depuis LINKHO
        </Button>
      </Section>
    </BaseLayout>
  )
}

import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = {
  bdeNom: string
  ecole: string
  typeEvenement: string
  dateDebut: string
  dateFin: string
  nbParticipants: number
  demandeId: string
}

export function NouvelleDemandEmail({ bdeNom, ecole, typeEvenement, dateDebut, dateFin, nbParticipants, demandeId }: Props) {
  return (
    <BaseLayout previewText={`Nouvelle demande de devis de ${bdeNom} — ${ecole}`}>
      <Text style={t.h1}>Nouvelle demande de devis</Text>
      <Text style={t.body}>
        <strong>{bdeNom}</strong> ({ecole}) vous a envoyé une demande de devis.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Type d&apos;événement</Text>
      <Text style={t.value}>{typeEvenement}</Text>
      <Text style={t.label}>Dates</Text>
      <Text style={t.value}>{fmtDate(dateDebut)} → {fmtDate(dateFin)}</Text>
      <Text style={t.label}>Participants</Text>
      <Text style={t.value}>{nbParticipants} personnes</Text>
      <Text style={t.muted}>
        Connectez-vous pour consulter la demande et envoyer votre devis.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/etablissement/demandes/${demandeId}`} style={t.btn}>
          Voir la demande
        </Button>
      </Section>
    </BaseLayout>
  )
}

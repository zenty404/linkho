import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { etabNom: string; montantTtc: number; evenementId: string }

export function DevisRecuEmail({ etabNom, montantTtc, evenementId }: Props) {
  return (
    <BaseLayout previewText={`Nouveau devis reçu de ${etabNom}`}>
      <Text style={t.h1}>Nouveau devis reçu</Text>
      <Text style={t.body}>
        L&apos;établissement <strong>{etabNom}</strong> vous a envoyé un devis pour votre événement.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Montant TTC</Text>
      <Text style={t.amount}>{fmtEuro(montantTtc)}</Text>
      <Text style={t.muted}>
        Connectez-vous pour consulter le détail du devis et l&apos;accepter ou le refuser.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Voir le devis
        </Button>
      </Section>
    </BaseLayout>
  )
}

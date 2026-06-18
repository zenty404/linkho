import { Hr, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

type Props = {
  evenementNom: string
  prenom: string
}

export function InscriptionRefuseeEmail({ evenementNom, prenom }: Props) {
  return (
    <BaseLayout previewText={`Votre inscription à ${evenementNom}`}>
      <Text style={t.h1}>Inscription non retenue</Text>
      <Text style={t.body}>
        Bonjour {prenom},
      </Text>
      <Text style={t.body}>
        Votre inscription à <strong>{evenementNom}</strong> n&apos;a pas été validée par le BDE.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.muted}>
        Pour toute question, contactez directement votre BDE organisateur.
      </Text>
    </BaseLayout>
  )
}

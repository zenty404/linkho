import { Hr, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

type Props = {
  evenementNom: string
  prenom: string
}

export function InscriptionValideeBdeEmail({ evenementNom, prenom }: Props) {
  return (
    <BaseLayout previewText={`Votre inscription à ${evenementNom} est confirmée !`}>
      <Text style={t.h1}>Votre inscription est confirmée ! 🎉</Text>
      <Text style={t.body}>
        Bonjour {prenom},
      </Text>
      <Text style={t.body}>
        Votre inscription à <strong>{evenementNom}</strong> a été validée par le BDE.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.muted}>
        Vous recevrez prochainement les informations pratiques pour l&apos;événement.
        Pour toute question, contactez directement votre BDE.
      </Text>
    </BaseLayout>
  )
}

import { notFound } from 'next/navigation'
import { getInscriptionById } from '@/lib/actions/inscriptions'
import { getFormulaireById } from '@/lib/actions/formulaires'
import { InscriptionDetail } from './inscription-detail'
import type { ChampFormulaire } from '@/lib/actions/formulaires'

type Props = { params: Promise<{ id: string }> }

export default async function InscriptionDetailPage({ params }: Props) {
  const { id } = await params

  const result = await getInscriptionById(id)
  if (result.error || !result.data) notFound()

  const inscription = result.data

  const formulaireResult = await getFormulaireById(inscription.formulaire_id)
  const champs = (formulaireResult.data?.champs ?? []) as unknown as ChampFormulaire[]

  return <InscriptionDetail inscription={inscription} champs={champs} />
}

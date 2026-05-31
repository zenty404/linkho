import { notFound } from 'next/navigation'
import { getFormulaireById } from '@/lib/actions/formulaires'
import { FormBuilder } from './form-builder-client'

type Props = { params: Promise<{ id: string }> }

export default async function FormulaireBuilderPage({ params }: Props) {
  const { id } = await params
  const result = await getFormulaireById(id)

  if (result.error || !result.data) notFound()

  return <FormBuilder formulaire={result.data} />
}

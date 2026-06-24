import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvenementComplet } from '@/lib/actions/evenements'
import { creerPaymentIntentAcompte } from '@/lib/actions/paiements'
import { PaiementIban } from './paiement-iban'

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getEvenementComplet(id)
  if (!result.data) notFound()

  const { reservation } = result.data
  if (!reservation) notFound()

  const isAcompte = reservation.statut === 'en_attente_acompte'
  if (!isAcompte) notFound()

  const piResult = await creerPaymentIntentAcompte(reservation.id)

  if (piResult.error || !piResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-navy)] p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col gap-5">
          <h1 className="text-xl font-bold text-[var(--color-navy)]">Erreur de paiement</h1>
          <p className="text-sm text-red-600">{piResult.error ?? 'Une erreur est survenue.'}</p>
          <Link
            href={`/bde/evenements/${id}`}
            className="inline-block text-center rounded-xl border border-[var(--color-navy)] text-[var(--color-navy)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-navy)] hover:text-white transition-colors"
          >
            Retour à mon événement
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PaiementIban
      ibanVirtuel={piResult.data.ibanVirtuel}
      reference={piResult.data.reference}
      montant={reservation.acompte_montant}
      evenementId={id}
    />
  )
}

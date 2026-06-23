import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvenementComplet } from '@/lib/actions/evenements'

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
  const isSolde = reservation.statut_solde === 'en_attente'

  if (!isAcompte && !isSolde) notFound()

  const titre = isAcompte ? "Paiement de l'acompte" : 'Paiement du solde'
  const montant = isAcompte ? reservation.acompte_montant : reservation.solde_montant

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-navy)] p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-[var(--color-navy)]">{titre}</h1>

        <p className="text-5xl font-bold text-[var(--color-brand)]">
          {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </p>

        <p className="text-gray-500 text-sm">
          Les informations de paiement seront disponibles prochainement.
        </p>

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

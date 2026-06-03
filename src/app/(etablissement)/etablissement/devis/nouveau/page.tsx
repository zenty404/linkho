import { redirect } from 'next/navigation'
import { createDevis } from '@/lib/actions/devis'

async function handleCreate(formData: FormData): Promise<void> {
  'use server'
  await createDevis(formData)
}

export default async function NouveauDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ demande_id?: string }>
}) {
  const { demande_id } = await searchParams
  if (!demande_id) redirect('/etablissement/demandes')

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-lg font-bold text-navy mb-2">Créer un devis</h1>
      <p className="text-sm text-gray-400 mb-8">
        Un devis vierge sera créé. Vous pourrez y ajouter les prestations dans l&apos;éditeur.
      </p>

      <form action={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <input type="hidden" name="demande_id" value={demande_id} />
        <input type="hidden" name="sous_total_ht" value="0" />
        <input type="hidden" name="item_libelle" value="Prestation principale" />
        <input type="hidden" name="item_quantite" value="1" />
        <input type="hidden" name="item_prix_unitaire" value="0" />

        <button
          type="submit"
          className="w-full py-3 bg-brand hover:bg-brand-light text-navy text-sm font-semibold rounded-lg transition-colors"
        >
          Créer et ouvrir l&apos;éditeur
        </button>
      </form>
    </div>
  )
}

import { createDevis } from '@/lib/actions/devis'

type Props = {
  searchParams: Promise<{ demande_id?: string }>
}

export default async function NouveauDevisPage({ searchParams }: Props) {
  async function handleSubmit(formData: FormData) {
    'use server'
    await createDevis(formData)
  }

  const { demande_id } = await searchParams

  if (!demande_id) {
    return (
      <div style={{ fontFamily: 'sans-serif' }}>
        <h1>Créer un devis</h1>
        <p style={{ color: 'red' }}>
          Paramètre <code>demande_id</code> manquant. Accédez à cette page depuis la liste des
          demandes.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 500, fontFamily: 'sans-serif' }}>
      <h1>Créer un devis</h1>
      <p style={{ color: '#666' }}>
        Demande : <code>{demande_id}</code>
      </p>

      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="demande_id" value={demande_id} />

        <fieldset style={{ border: '1px solid #ccc', padding: 12 }}>
          <legend>Prestation</legend>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="item_libelle">Libellé *</label><br />
            <input
              id="item_libelle"
              name="item_libelle"
              required
              placeholder="Location de salle"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="item_quantite">Quantité *</label><br />
              <input
                id="item_quantite"
                name="item_quantite"
                type="number"
                min="1"
                defaultValue="1"
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="item_prix_unitaire">Prix unitaire HT (€) *</label><br />
              <input
                id="item_prix_unitaire"
                name="item_prix_unitaire"
                type="number"
                min="0"
                step="0.01"
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="sous_total_ht">Sous-total HT (€) *</label><br />
          <input
            id="sous_total_ht"
            name="sous_total_ht"
            type="number"
            min="0"
            step="0.01"
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label htmlFor="message_client">Message au BDE (facultatif)</label><br />
          <textarea
            id="message_client"
            name="message_client"
            rows={3}
            style={{ width: '100%' }}
          />
        </div>

        <button type="submit" style={{ alignSelf: 'flex-start' }}>
          Envoyer le devis
        </button>
      </form>
    </div>
  )
}

import { createDemande, getDemandesByBde } from '@/lib/actions/demandes'

// TODO: remplacer par l'UUID réel du Château Test (SELECT id FROM etablissement_profiles LIMIT 1)
const ETABLISSEMENT_TEST_ID = '1bdfde1e-205f-4a97-a41c-69fdc14b6ee9'

export default async function BdeDemandesPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    await createDemande(formData)
  }

  const result = await getDemandesByBde()
  const demandes = result.data ?? []

  return (
    <div style={{ maxWidth: 600, fontFamily: 'sans-serif' }}>
      <h1>Demandes de devis</h1>

      {result.error && (
        <p style={{ color: 'red' }}>Erreur chargement : {result.error}</p>
      )}

      <section style={{ marginBottom: 40 }}>
        <h2>Nouvelle demande</h2>
        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="etablissement_id" value={ETABLISSEMENT_TEST_ID} />

          <div>
            <label htmlFor="type_evenement">Type d&apos;événement *</label><br />
            <input
              id="type_evenement"
              name="type_evenement"
              required
              placeholder="Soirée, gala, WEI…"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="date_debut">Date de début *</label><br />
            <input id="date_debut" name="date_debut" type="date" required style={{ width: '100%' }} />
          </div>

          <div>
            <label htmlFor="date_fin">Date de fin *</label><br />
            <input id="date_fin" name="date_fin" type="date" required style={{ width: '100%' }} />
          </div>

          <div>
            <label htmlFor="nb_participants">Nombre de participants *</label><br />
            <input
              id="nb_participants"
              name="nb_participants"
              type="number"
              min="1"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label htmlFor="message">Message (facultatif)</label><br />
            <textarea
              id="message"
              name="message"
              rows={3}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" style={{ alignSelf: 'flex-start' }}>
            Envoyer la demande
          </button>
        </form>
      </section>

      <section>
        <h2>Mes demandes ({demandes.length})</h2>
        {demandes.length === 0 ? (
          <p>Aucune demande pour l&apos;instant.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 8px' }}>Type</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 8px' }}>Dates</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 8px' }}>Participants</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 8px' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: '4px 8px' }}>{d.type_evenement}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {d.date_debut} → {d.date_fin}
                  </td>
                  <td style={{ padding: '4px 8px' }}>{d.nb_participants}</td>
                  <td style={{ padding: '4px 8px' }}>{d.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

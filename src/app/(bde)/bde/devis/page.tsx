import { getDevisByBde } from '@/lib/actions/devis'

export default async function BdeDevisPage() {
  const result = await getDevisByBde()
  const devis = result.data ?? []

  return (
    <div style={{ maxWidth: 700, fontFamily: 'sans-serif' }}>
      <h1>Devis reçus</h1>

      {result.error && (
        <p style={{ color: 'red' }}>Erreur chargement : {result.error}</p>
      )}

      {devis.length === 0 ? (
        <p>Aucun devis reçu pour l&apos;instant.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Numéro</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Dates</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Montant TTC</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {devis.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>
                  {d.numero || '(en attente)'}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {d.date_evenement_debut} → {d.date_evenement_fin}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                  {d.total_ttc != null
                    ? `${d.total_ttc.toFixed(2)} €`
                    : `${d.sous_total_ht.toFixed(2)} € HT`}
                </td>
                <td style={{ padding: '6px 8px' }}>{d.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

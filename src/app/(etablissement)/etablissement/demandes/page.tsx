import Link from 'next/link'
import { getDemandesByEtablissement } from '@/lib/actions/demandes'

export default async function EtablissementDemandesPage() {
  const result = await getDemandesByEtablissement()
  const demandes = result.data ?? []

  return (
    <div style={{ maxWidth: 700, fontFamily: 'sans-serif' }}>
      <h1>Demandes reçues</h1>

      {result.error && (
        <p style={{ color: 'red' }}>Erreur chargement : {result.error}</p>
      )}

      {demandes.length === 0 ? (
        <p>Aucune demande reçue pour l&apos;instant.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Type</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Dates</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Participants</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Statut</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '6px 8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: '6px 8px' }}>{d.type_evenement}</td>
                <td style={{ padding: '6px 8px' }}>
                  {d.date_debut} → {d.date_fin}
                </td>
                <td style={{ padding: '6px 8px' }}>{d.nb_participants}</td>
                <td style={{ padding: '6px 8px' }}>{d.statut}</td>
                <td style={{ padding: '6px 8px' }}>
                  <Link href={`/etablissement/devis/nouveau?demande_id=${d.id}`}>
                    Créer un devis
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

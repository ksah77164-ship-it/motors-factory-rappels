# motors-factory-rappels

Outils Motors Factory (pages statiques, utilisables hors ligne).

| Page | Rôle |
|------|------|
| `index.html` | Rappels clients |
| `releves.html` | Relevés bancaires & factures |
| `montres.html` | **Les Montres d'Albert** — suivi d'achat, livraison et revente de montres |

## Les Montres d'Albert (`montres.html`)

Suivi complet du projet Albert :

- **Fiche montre** : photo, nom, référence, détails (état, boîte, papiers…), projet.
- **Achat** : date, prix d'achat, frais (port + douane), pays d'achat, vendeur/plateforme.
- **Livraison** : lieu, pays, date prévue, numéro de suivi, statut *en transit* / *reçue* avec date de réception.
- **Revente** : destination (garder / revendre), prix visé, prix de vente réel, date, acheteur,
  plus-value calculée automatiquement (prix de vente − prix d'achat − frais).
- **Tableau de bord** : nombre de montres, total investi, en transit, à vendre / gardées,
  vendues, plus-value réalisée.
- **Anti-doublon par photo** : chaque photo reçoit une empreinte visuelle (dHash + aHash).
  En photographiant une montre (bouton « Je l'ai déjà ? »), l'appli compare l'image à toute la
  collection et affiche les correspondances avec un score. La référence et le nom sont aussi
  comparés. La vérification se déclenche automatiquement à l'ajout d'une photo.
- **Projets** : chaque montre est rattachée à un projet (« Albert » par défaut), avec des onglets
  pour basculer de l'un à l'autre.
- **Export CSV**, **sauvegarde JSON** (fiches + photos) et **restauration**.

Stockage 100 % local : les fiches dans `localStorage`, les photos dans `IndexedDB`.
Rien n'est envoyé sur un serveur — pense à faire une sauvegarde régulièrement.

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

### Partage à deux, en temps réel

Le bouton ☁︎ en haut de la page relie l'appli à un coffre partagé
(Google Sheet + Google Apps Script) : voir `apps-script-montres.gs`, qui contient
la marche à suivre complète (~5 minutes, une seule fois, sur un seul compte Google).

Une fois le coffre créé, le bouton **« Lien de partage »** produit un lien : la deuxième
personne n'a qu'à l'ouvrir, tout se configure tout seul.

Fonctionnement :

- Échange automatique toutes les **9 secondes** quand la page est ouverte et utilisée
  (35 s au repos, 60 s en arrière-plan, rien du tout quand l'onglet est fermé — pour rester
  très largement dans les quotas gratuits de Google).
- **Fusion montre par montre** : chacun saisit de son côté sans rien écraser. Si deux personnes
  modifient *la même* montre, la saisie la plus récente l'emporte.
- Les **photos** transitent par un dossier Google Drive et sont mises en cache sur chaque appareil
  (téléchargées une seule fois).
- Chaque fiche indique **qui a fait la dernière saisie**.
- **Hors ligne** : la saisie continue de fonctionner, la pastille passe au rouge, et tout repart
  automatiquement dès le retour du réseau.
- Les **suppressions** se propagent aussi.

Sans coffre configuré, l'appli reste 100 % locale : fiches dans `localStorage`,
photos dans `IndexedDB`, rien n'est envoyé nulle part.

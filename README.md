# motors-factory-rappels

Outils Motors Factory (pages statiques, utilisables hors ligne).

| Page | Rôle |
|------|------|
| `index.html` | Rappels clients |
| `releves.html` | Relevés bancaires & factures |
| `montres.html` | **Les Montres d'Alber** — suivi d'achat, livraison et revente de montres |

## Les Montres d'Alber (`montres.html`)

Suivi complet du projet Alber :

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
- **Projets** : chaque montre est rattachée à un projet (« Alber » par défaut), avec des onglets
  pour basculer de l'un à l'autre.
- **Export CSV**, **sauvegarde JSON** (fiches + photos) et **import** qui ajoute sans effacer.
- **Recherche internet** : bouton 🔎. Deux chemins, tous deux en une touche —
  photographier la montre puis **« Continuer sur Google »** (la photo part vers Lens par le
  partage du téléphone, la collection est vérifiée au passage), ou taper la référence et
  **« Rechercher sur Google »** (la touche Entrée marche aussi).
  Un repli « Voir les prix ailleurs » donne accès aux **ventes conclues sur eBay** (les prix
  réels de revente), Chrono24, Google Shopping, Vinted, Leboncoin, Yahoo Auctions Japon, Amazon.
  **Quand le coffre est branché**, un bouton « ⚡ Recherche image directe » dépose la photo dans
  le Drive, ce qui lui donne une adresse, et ouvre Google Lens dessus : les résultats arrivent
  sans passer par le menu de partage. La photo est alors accessible à qui possède ce lien.
  Chaque fiche a aussi un bouton « Chercher son prix » pré-rempli avec sa référence.

  *Limite assumée* : aucun moteur de reconnaissance d'image (Lens, Amazon) n'est ouvert à un
  site tiers. L'appli ne peut donc pas identifier la montre elle-même à partir d'une photo ;
  elle passe la main à Lens, qui le fait très bien.

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

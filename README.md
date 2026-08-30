# motors-factory-rappels

Outils Motors Factory (pages statiques, utilisables hors ligne).

| Page | Rôle |
|------|------|
| `index.html` | Rappels clients |
| `releves.html` | Relevés bancaires & factures |
| `montres.html` | Page de renvoi — *Les Montres d'Alber* a rejoint le dépôt `Alber` |

## Les Montres d'Alber — déplacée

L'application a rejoint le dépôt **[`Alber`](https://github.com/ksah77164-ship-it/Alber)**,
avec les autres applications d'Alber (Bénéfices, Bordereaux, Penaltys) : un seul
dépôt, une seule adresse, un seul déploiement. Elle y vit dans `montres/`, servie
sous `/montres/`, et sa documentation complète est dans
[`montres/README.md`](https://github.com/ksah77164-ship-it/Alber/blob/main/montres/README.md).

`montres.html` reste ici en **page de renvoi**, pour que les liens et les
installations existantes ne tombent pas sur une page introuvable. L'adresse du
portail Alber se renseigne dans la constante `PORTAIL_ALBER`, en haut du script
de cette page.

> **Les données ne suivent pas toutes seules** : elles sont enregistrées dans le
> navigateur, sous l'ancienne adresse. Pour les emporter, ouvrir l'ancienne appli
> ▸ **Sauvegarde JSON**, puis **Import** sur la nouvelle.

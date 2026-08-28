/**
 * LES MONTRES D'ALBER — partage en temps réel (Google Apps Script + Google Sheet)
 * ================================================================================
 *
 * Ce script transforme un Google Sheet en coffre partagé pour l'appli montres.html.
 * Deux personnes (ou plus) peuvent saisir chacune de leur côté : tout se retrouve
 * chez l'autre en quelques secondes, sans jamais s'écraser.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * INSTALLATION (une seule fois, ~5 minutes, sur UN SEUL compte Google)
 * ──────────────────────────────────────────────────────────────────────────────
 *  1. Allez sur https://sheets.google.com et créez un NOUVEAU Google Sheet.
 *     (Un coffre dédié aux montres : ne réutilisez pas celui des relevés.)
 *  2. Menu « Extensions » ▸ « Apps Script ».
 *  3. Effacez le code présent, collez TOUT ce fichier, puis enregistrez (💾).
 *  4. Choisissez un mot de passe et écrivez-le dans TOKEN ci-dessous, entre les
 *     guillemets. C'est celui que vous saisirez tous les deux dans l'appli.
 *     (Laisser "" = aucun mot de passe : déconseillé, l'adresse suffirait à tout lire.)
 *  5. « Déployer » ▸ « Nouveau déploiement »
 *       - Type                 : Application Web
 *       - Exécuter en tant que : Moi
 *       - Qui a accès          : Tout le monde
 *     Puis « Déployer » et autorisez l'accès (écran Google habituel).
 *  6. Copiez l'URL de l'application Web (elle finit par « /exec »).
 *  7. Dans montres.html, bouton « ☁︎ » en haut ▸ collez l'URL + le mot de passe
 *     + votre prénom ▸ « Connecter ». Puis « Copier le lien de partage » et
 *     envoyez-le à la deuxième personne : elle n'aura qu'à l'ouvrir.
 *
 * ⚠️ Si vous modifiez ce script plus tard : « Déployer » ▸ « Gérer les déploiements »
 *    ▸ crayon ✎ ▸ Version « Nouvelle version » ▸ « Déployer » (garde la même URL).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * CE QUI EST STOCKÉ
 * ──────────────────────────────────────────────────────────────────────────────
 *  - Feuille « Montres » : une ligne par montre (lisible et modifiable à la main).
 *  - Feuille « Photos »  : la correspondance photo ▸ fichier Drive.
 *  - Les photos elles-mêmes : dans un dossier Drive « Montres d'Alber — photos ».
 *
 * Règle de fusion : chaque montre porte la date/heure de sa dernière modification.
 * Si deux personnes touchent LA MÊME montre en même temps, la modification la plus
 * récente l'emporte. Deux montres différentes ne se gênent jamais.
 * ================================================================================
 */

// ⬇️ Mettez ici votre mot de passe (le même que dans l'appli). "" = aucun contrôle.
const TOKEN = "";

const FEUILLE = "Montres";
const FEUILLE_PHOTOS = "Photos";
const DOSSIER_PHOTOS = "Montres d'Alber — photos";

const ENTETES = [
  "id", "sync", "majLe", "modifiePar", "supprime",
  "nom", "ref", "projet", "details",
  "dateAchat", "prixAchat", "frais", "paysAchat", "vendeur",
  "lieu", "paysLivraison", "datePrevue", "suivi", "recu", "dateRecu",
  "destination", "prixVise", "vendue", "prixVente", "dateVente", "acheteur",
  "photoId", "dhash", "ahash", "creeLe",
  // Ajoutées le 28/08/2026 : le matériel (coffrets, kits, outils) se range dans
  // la même feuille que les montres — c'est un achat comme un autre, il lui
  // manque seulement la revente. Et « payePar » sert aux comptes entre associés.
  "type", "payePar"
];
const ENTETES_PHOTOS = ["photoId", "fileId", "creeLe"];

// Champs numériques et booléens (pour relire proprement)
const NOMBRES = { prixAchat: 1, frais: 1, prixVise: 1, prixVente: 1 };
const BOOLEENS = { supprime: 1, recu: 1, vendue: 1 };

/* ── Utilitaires ─────────────────────────────────────────────────────────── */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tokenOk_(t) {
  return !TOKEN || String(t == null ? "" : t) === TOKEN;
}

function feuille_(nom, entetes) {
  nom = nom || FEUILLE;
  entetes = entetes || ENTETES;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nom);
  if (!sh) {
    sh = ss.insertSheet(nom);
    // Tout en texte : les dates restent « 2026-09-05 » et les empreintes gardent
    // leurs zéros de tête (0070e4c8… ne doit pas devenir un nombre).
    sh.getRange(1, 1, sh.getMaxRows(), entetes.length).setNumberFormat("@");
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(entetes);
    sh.setFrozenRows(1);
  }
  // Une feuille créée par une version précédente est trop étroite : on
  // l'élargit et on écrit les en-têtes qui manquent, sans toucher aux données
  // déjà en place. Sans ça, la première écriture planterait.
  if (sh.getMaxColumns() < entetes.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), entetes.length - sh.getMaxColumns());
    sh.getRange(1, 1, sh.getMaxRows(), entetes.length).setNumberFormat("@");
  }
  const enPlace = sh.getRange(1, 1, 1, entetes.length).getValues()[0];
  let aCompleter = false;
  for (let i = 0; i < entetes.length; i++) {
    if (String(enPlace[i] || "") !== entetes[i]) { aCompleter = true; break; }
  }
  if (aCompleter) sh.getRange(1, 1, 1, entetes.length).setValues([entetes]);
  return sh;
}

function texte_(v) {
  if (v == null) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(v);
}

function nombre_(v) {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function bool_(v) {
  const s = String(v == null ? "" : v).toLowerCase();
  return s === "1" || s === "true" || s === "oui" || s === "vrai";
}

/* ── Lecture / écriture de la feuille Montres ────────────────────────────── */

function toutesLesLignes_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, ENTETES.length).getValues();
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    const r = vals[i];
    if (!texte_(r[0])) continue;               // ligne vide
    const o = {};
    for (let c = 0; c < ENTETES.length; c++) {
      const cle = ENTETES[c];
      if (NOMBRES[cle]) o[cle] = nombre_(r[c]);
      else if (BOOLEENS[cle]) o[cle] = bool_(r[c]);
      else o[cle] = texte_(r[c]);
    }
    o._ligne = i + 2;
    out.push(o);
  }
  return out;
}

function versLigne_(o) {
  const ligne = [];
  for (let c = 0; c < ENTETES.length; c++) {
    const cle = ENTETES[c];
    const v = o[cle];
    if (NOMBRES[cle]) ligne.push(String(nombre_(v)));
    else if (BOOLEENS[cle]) ligne.push(v ? "1" : "0");
    else ligne.push(v == null ? "" : String(v));
  }
  return ligne;
}

function ecrireLigne_(sh, numLigne, valeurs) {
  const plage = sh.getRange(numLigne, 1, 1, ENTETES.length);
  plage.setNumberFormat("@");
  plage.setValues([valeurs]);
}

/**
 * Applique les montres reçues. Fusion « la plus récente gagne », montre par montre.
 * Renvoie le nombre de lignes réellement modifiées.
 */
function appliquer_(sh, recues, sync, nomDefaut) {
  if (!recues || !recues.length) return 0;
  const existantes = toutesLesLignes_(sh);
  const parId = {};
  existantes.forEach(function (o) { parId[o.id] = o; });

  let n = 0;
  let prochaineLigne = sh.getLastRow() + 1;

  recues.forEach(function (m) {
    const id = texte_(m.id);
    if (!id) return;
    const ancienne = parId[id];
    const majRecue = texte_(m.majLe);

    // Conflit : on ne remplace que si la version reçue est au moins aussi récente.
    if (ancienne && texte_(ancienne.majLe) > majRecue) return;

    const o = {};
    ENTETES.forEach(function (cle) { o[cle] = m[cle]; });
    o.id = id;
    o.sync = sync;
    o.majLe = majRecue || sync;
    o.modifiePar = texte_(m.modifiePar) || nomDefaut || "";
    if (ancienne && !texte_(o.creeLe)) o.creeLe = ancienne.creeLe;

    const valeurs = versLigne_(o);
    if (ancienne) {
      ecrireLigne_(sh, ancienne._ligne, valeurs);
    } else {
      ecrireLigne_(sh, prochaineLigne, valeurs);
      parId[id] = { _ligne: prochaineLigne, majLe: o.majLe };
      prochaineLigne++;
    }
    n++;
  });
  return n;
}

function depuis_(sh, depuis) {
  const toutes = toutesLesLignes_(sh);
  const d = texte_(depuis);
  const out = [];
  toutes.forEach(function (o) {
    if (!d || texte_(o.sync) > d) {
      delete o._ligne;
      out.push(o);
    }
  });
  return out;
}

/* ── Photos (Google Drive) ───────────────────────────────────────────────── */

function dossierPhotos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("dossierPhotos");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* recréé plus bas */ }
  }
  const it = DriveApp.getFoldersByName(DOSSIER_PHOTOS);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER_PHOTOS);
  props.setProperty("dossierPhotos", f.getId());
  return f;
}

function indexPhotos_() {
  const sh = feuille_(FEUILLE_PHOTOS, ENTETES_PHOTOS);
  const last = sh.getLastRow();
  const idx = {};
  if (last > 1) {
    const vals = sh.getRange(2, 1, last - 1, ENTETES_PHOTOS.length).getValues();
    for (let i = 0; i < vals.length; i++) {
      const pid = texte_(vals[i][0]);
      if (pid) idx[pid] = texte_(vals[i][1]);
    }
  }
  return idx;
}

function enregistrerPhotos_(photos) {
  if (!photos) return 0;
  const cles = Object.keys(photos);
  if (!cles.length) return 0;

  const sh = feuille_(FEUILLE_PHOTOS, ENTETES_PHOTOS);
  const idx = indexPhotos_();
  const dossier = dossierPhotos_();
  const nouvelles = [];

  cles.forEach(function (pid) {
    if (idx[pid]) return;                       // déjà stockée : les photos sont immuables
    const url = String(photos[pid] || "");
    const virgule = url.indexOf(",");
    if (virgule < 0) return;
    try {
      const octets = Utilities.base64Decode(url.substring(virgule + 1));
      const blob = Utilities.newBlob(octets, "image/jpeg", pid + ".jpg");
      const f = dossier.createFile(blob);
      nouvelles.push([pid, f.getId(), new Date().toISOString()]);
      idx[pid] = f.getId();
    } catch (e) { /* photo illisible : on ignore, la fiche reste valable */ }
  });

  if (nouvelles.length) {
    const depart = sh.getLastRow() + 1;
    const plage = sh.getRange(depart, 1, nouvelles.length, ENTETES_PHOTOS.length);
    plage.setNumberFormat("@");
    plage.setValues(nouvelles);
  }
  return nouvelles.length;
}

/**
 * Rend une photo accessible par adresse publique, le temps que Google Lens
 * aille la chercher. Sans cela, impossible d'ouvrir une recherche par image :
 * un site web n'a pas le droit d'envoyer un fichier local à Google.
 * ⚠️ La photo devient visible par quiconque possède le lien (lien imprévisible).
 */
function lienPhoto_(photoId) {
  const idx = indexPhotos_();
  const fileId = idx[texte_(photoId)];
  if (!fileId) return null;
  try {
    const f = DriveApp.getFileById(fileId);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      id: fileId,
      url: "https://lh3.googleusercontent.com/d/" + fileId,
      secours: "https://drive.google.com/uc?export=view&id=" + fileId
    };
  } catch (e) {
    return null;
  }
}

function lirePhoto_(photoId) {
  const idx = indexPhotos_();
  const fileId = idx[texte_(photoId)];
  if (!fileId) return null;
  try {
    const blob = DriveApp.getFileById(fileId).getBlob();
    return "data:image/jpeg;base64," + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return null;
  }
}

/* ── Points d'entrée ─────────────────────────────────────────────────────── */

/**
 * GET ?token=…                  → état du coffre (vérification rapide au navigateur)
 * GET ?token=…&depuis=ISO       → montres modifiées depuis cet horodatage
 * GET ?token=…&photo=<photoId>  → la photo, en base64
 * GET ?token=…&lien=<photoId>   → adresse publique de la photo (recherche par image)
 */
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  if (!tokenOk_(p.token)) return json_({ error: "unauthorized" });

  if (p.photo) {
    const data = lirePhoto_(p.photo);
    return json_(data ? { ok: true, id: p.photo, data: data } : { ok: false, id: p.photo });
  }

  if (p.lien) {
    const l = lienPhoto_(p.lien);
    return json_(l ? { ok: true, id: p.lien, url: l.url, secours: l.secours }
                   : { ok: false, id: p.lien });
  }

  const sh = feuille_();
  const curseur = new Date(Date.now() - 1000).toISOString();

  if (p.depuis != null && p.depuis !== "") {
    return json_({ ok: true, serveur: curseur, montres: depuis_(sh, p.depuis) });
  }
  if (p.tout === "1") {
    return json_({ ok: true, serveur: curseur, montres: depuis_(sh, "") });
  }

  const toutes = toutesLesLignes_(sh);
  let vivantes = 0;
  toutes.forEach(function (o) { if (!o.supprime) vivantes++; });
  return json_({
    ok: true, message: "Coffre Montres d'Alber opérationnel.",
    montres: vivantes, lignes: toutes.length, serveur: curseur
  });
}

/**
 * POST { token, depuis, nom, montres:[…], photos:{photoId:dataURL} }
 *  → enregistre ce qui est envoyé, puis renvoie tout ce qui a changé depuis « depuis ».
 */
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ error: "bad json" }); }
  if (!tokenOk_(body.token)) return json_({ error: "unauthorized" });

  const lock = LockService.getScriptLock();
  try { lock.waitLock(25000); }
  catch (err) { return json_({ error: "coffre occupé, réessayez" }); }

  try {
    const sh = feuille_();
    const sync = new Date().toISOString();
    const curseur = new Date(Date.now() - 1000).toISOString();

    const nbPhotos = enregistrerPhotos_(body.photos);
    const nbMontres = appliquer_(sh, body.montres, sync, texte_(body.nom));

    return json_({
      ok: true, serveur: curseur, enregistrees: nbMontres, photos: nbPhotos,
      montres: depuis_(sh, texte_(body.depuis))
    });
  } finally {
    lock.releaseLock();
  }
}

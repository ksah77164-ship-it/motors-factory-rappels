/**
 * Réunion d'information périscolaire maternelle — inscriptions des familles
 * =============================================================================
 *
 * Ce script reçoit les réponses du formulaire (reunion-maternelle.html) et les
 * range dans un Google Sheet : une ligne par famille (nom, présence, nombre de
 * personnes, date de réception). Une famille qui répond deux fois remplace sa
 * réponse précédente. Les inscriptions ferment automatiquement le
 * 22 septembre 2026 à 22h (heure de Paris), même si quelqu'un contourne la page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTALLATION (une seule fois, ~5 minutes)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Allez sur https://sheets.google.com et créez un NOUVEAU Google Sheet
 *    (par exemple « Réunion maternelle 23 septembre »).
 * 2. Menu « Extensions » ▸ « Apps Script ».
 * 3. Effacez le code présent, collez TOUT ce fichier, puis enregistrez (💾).
 * 4. Choisissez un mot de passe organisateur et écrivez-le dans TOKEN ci-dessous
 *    (entre les guillemets). Il sert uniquement à consulter la liste des réponses
 *    depuis la page (#organisateur) ; les familles n'en ont pas besoin.
 * 5. Cliquez « Déployer » ▸ « Nouveau déploiement ».
 *      - Type                 : Application Web
 *      - Exécuter en tant que : Moi
 *      - Qui a accès          : Tout le monde
 *    Puis « Déployer » et autorisez l'accès (écran Google habituel).
 * 6. Copiez l'URL de l'application Web (elle finit par « /exec »).
 * 7. Dans reunion-maternelle.html, collez cette URL dans SCRIPT_URL (tout en haut
 *    du <script>), puis publiez la page (commit sur GitHub).
 * 8. Envoyez aux familles le lien :
 *    https://ksah77164-ship-it.github.io/motors-factory-rappels/reunion-maternelle.html
 *    Pour voir les réponses : même lien suivi de #organisateur, puis le mot de passe.
 *    Les réponses sont aussi directement dans le Google Sheet, onglet « Inscriptions ».
 *
 * ⚠️ Si vous modifiez ce script plus tard : « Déployer » ▸ « Gérer les déploiements »
 *    ▸ crayon ✎ ▸ Version « Nouvelle version » ▸ « Déployer » (garde la même URL).
 * =============================================================================
 */

// ⬇️ Mot de passe organisateur (lecture de la liste). "" = liste lisible sans mot de passe.
const TOKEN = "";

// Clôture des inscriptions : 22 septembre 2026 à 22h00, heure de Paris.
const CLOTURE = new Date("2026-09-22T22:00:00+02:00");

const FEUILLE = "Inscriptions";
const ENTETES = ["Reçu le", "Famille", "Présence", "Nombre de personnes", "Clé"];

function feuille_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(FEUILLE);
  if (!sh) sh = ss.insertSheet(FEUILLE);
  if (sh.getLastRow() === 0) {
    sh.appendRow(ENTETES);
    sh.getRange(1, 1, 1, ENTETES.length).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.hideColumns(ENTETES.length); // la clé de dédoublonnage n'a pas besoin d'être visible
  }
  return sh;
}

function tokenOk_(t) {
  return !TOKEN || String(t == null ? "" : t) === TOKEN;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Clé de comparaison : « Famille DUPONT », « famille dupont » et « Dupont » sont la même famille.
function cle_(nom) {
  return String(nom || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^famille\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function lire_() {
  const sh = feuille_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, ENTETES.length).getValues();
  const tz = Session.getScriptTimeZone();
  const liste = [];
  for (let i = 0; i < vals.length; i++) {
    const r = vals[i];
    if (!r[1]) continue;
    liste.push({
      ligne: i + 2,
      horodatage: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, "dd/MM HH:mm") : String(r[0] || ""),
      famille: String(r[1]),
      presence: String(r[2]).toLowerCase() === "oui" ? "oui" : "non",
      nombre: Number(r[3]) || 0,
      cle: String(r[4] || cle_(r[1]))
    });
  }
  return liste;
}

// Lecture (organisateur) : la liste des réponses et les totaux.
function doGet(e) {
  const t = (e && e.parameter) ? e.parameter.token : "";
  if (!tokenOk_(t)) return json_({ error: "unauthorized" });
  const liste = lire_().map(function (r) {
    return { famille: r.famille, presence: r.presence, nombre: r.nombre, horodatage: r.horodatage };
  });
  const presentes = liste.filter(function (r) { return r.presence === "oui"; });
  return json_({
    inscriptions: liste,
    totaux: {
      familles: liste.length,
      presentes: presentes.length,
      personnes: presentes.reduce(function (s, r) { return s + r.nombre; }, 0)
    },
    cloture: CLOTURE.toISOString()
  });
}

// Écriture (familles) : enregistre ou remplace la réponse d'une famille.
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ error: "bad json" }); }

  if (new Date() >= CLOTURE) return json_({ error: "closed" });

  const famille = String(body.famille || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (famille.length < 2) return json_({ error: "famille manquante" });
  const presence = body.presence === "oui" ? "oui" : "non";
  let nombre = presence === "oui" ? Math.round(Number(body.nombre)) : 0;
  if (presence === "oui" && !(nombre >= 1 && nombre <= 10)) nombre = 1;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = feuille_();
    const cle = cle_(famille);
    const existante = lire_().filter(function (r) { return r.cle === cle; })[0];
    const ligne = [new Date(), famille, presence === "oui" ? "Oui" : "Non", nombre, cle];
    if (existante) sh.getRange(existante.ligne, 1, 1, ENTETES.length).setValues([ligne]);
    else sh.appendRow(ligne);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

/**
 * Motors Factory — Relevés : stockage en ligne (Google Apps Script + Google Sheet)
 * =============================================================================
 *
 * Ce script transforme un Google Sheet en "coffre" pour vos opérations de relevés.
 * L'appli (releves.html) lit et enregistre vos données ici, pour les retrouver
 * sur tous vos appareils.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTALLATION (une seule fois, ~5 minutes)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Allez sur https://sheets.google.com et créez un NOUVEAU Google Sheet.
 *    (Ne réutilisez pas celui des Rappels : gardez un coffre dédié aux relevés.)
 * 2. Menu « Extensions » ▸ « Apps Script ».
 * 3. Effacez le code présent, collez TOUT ce fichier, puis enregistrez (💾).
 * 4. Choisissez un mot de passe et écrivez-le dans la variable TOKEN ci-dessous
 *    (entre les guillemets). C'est le même mot de passe que vous saisirez dans
 *    l'appli, bouton « ☁︎ Cloud ». Laissez "" pour n'avoir aucun mot de passe
 *    (déconseillé : n'importe qui avec l'adresse pourrait voir vos données).
 * 5. Cliquez « Déployer » ▸ « Nouveau déploiement ».
 *      - Type            : Application Web
 *      - Exécuter en tant que : Moi
 *      - Qui a accès     : Tout le monde
 *    Puis « Déployer » et autorisez l'accès (écran Google habituel).
 * 6. Copiez l'URL de l'application Web (elle finit par « /exec »).
 * 7. Dans l'appli relevés, bouton « ☁︎ Cloud » : collez cette URL + le mot de passe,
 *    puis « Connecter & charger ». C'est prêt, sur chaque appareil.
 *
 * ⚠️ Si vous modifiez ce script plus tard : « Déployer » ▸ « Gérer les déploiements »
 *    ▸ crayon ✎ ▸ Version « Nouvelle version » ▸ « Déployer » (garde la même URL).
 * =============================================================================
 */

// ⬇️ Mettez ici votre mot de passe (le même que dans l'appli). "" = aucun contrôle.
const TOKEN = "";

const FEUILLE = "Releves";
const ENTETES = ["date", "dateISO", "libelle", "montant", "type", "sens", "ecarte", "ecarteAuto", "pointe"];
const FEUILLE_FAC = "Factures";
const ENTETES_FAC = ["date", "dateISO", "numero", "client", "montant", "mode", "statut", "note"];

function feuille_(nom, entetes) {
  nom = nom || FEUILLE;
  entetes = entetes || ENTETES;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nom);
  if (!sh) sh = ss.insertSheet(nom);
  if (sh.getLastRow() === 0) sh.appendRow(entetes);
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

// Lecture : renvoie les opérations ET les factures enregistrées.
function doGet(e) {
  const t = (e && e.parameter) ? e.parameter.token : "";
  if (!tokenOk_(t)) return json_({ error: "unauthorized" });

  const sh = feuille_();
  const last = sh.getLastRow();
  const ops = [];
  if (last > 1) {
    const vals = sh.getRange(2, 1, last - 1, ENTETES.length).getValues();
    for (let i = 0; i < vals.length; i++) {
      const r = vals[i];
      ops.push({
        date: r[0], dateISO: r[1], libelle: r[2], montant: Number(r[3]) || 0,
        type: r[4], sens: r[5], ecarte: r[6], ecarteAuto: r[7], pointe: r[8]
      });
    }
  }

  const shF = feuille_(FEUILLE_FAC, ENTETES_FAC);
  const lastF = shF.getLastRow();
  const factures = [];
  if (lastF > 1) {
    const valsF = shF.getRange(2, 1, lastF - 1, ENTETES_FAC.length).getValues();
    for (let i = 0; i < valsF.length; i++) {
      const r = valsF[i];
      factures.push({
        date: r[0], dateISO: r[1], numero: r[2], client: r[3],
        montant: Number(r[4]) || 0, mode: r[5], statut: r[6], note: r[7]
      });
    }
  }

  return json_({ ops: ops, factures: factures });
}

// Écriture : remplace le coffre par les données reçues (opérations et/ou factures).
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ error: "bad json" }); }
  if (!tokenOk_(body.token)) return json_({ error: "unauthorized" });

  if (Array.isArray(body.ops)) {
    const sh = feuille_();
    const last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, ENTETES.length).clearContent();
    if (body.ops.length) {
      const rows = body.ops.map(function (o) {
        return [
          o.date || "", o.dateISO || "", o.libelle || "", Number(o.montant) || 0,
          o.type || "", o.sens || "", o.ecarte ? 1 : 0, o.ecarteAuto ? 1 : 0, o.pointe ? 1 : 0
        ];
      });
      sh.getRange(2, 1, rows.length, ENTETES.length).setValues(rows);
    }
  }

  if (Array.isArray(body.factures)) {
    const shF = feuille_(FEUILLE_FAC, ENTETES_FAC);
    const lastF = shF.getLastRow();
    if (lastF > 1) shF.getRange(2, 1, lastF - 1, ENTETES_FAC.length).clearContent();
    if (body.factures.length) {
      const rowsF = body.factures.map(function (f) {
        return [
          f.date || "", f.dateISO || "", String(f.numero || ""), f.client || "",
          Number(f.montant) || 0, f.mode || "", f.statut || "", f.note || ""
        ];
      });
      shF.getRange(2, 1, rowsF.length, ENTETES_FAC.length).setValues(rowsF);
    }
  }

  return json_({ ok: true });
}

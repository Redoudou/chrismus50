/**
 * chrismus50 — server side.
 *
 * Storage design (optimized for easy navigation afterwards):
 *
 *   Souvenirs — 50 ans Chris & Mus/
 *   ├── 📷 Photos/                    every photo, named "Prénom — 1.jpg"
 *   ├── 🎥 Vidéos/                    every video, named "Message de Prénom.mp4"
 *   ├── 📒 Journal des contributions  (Sheet: date, prénom, message, counts)
 *   └── _technique — ne pas toucher/  in-flight video chunks, auto-cleaned
 *
 * Everything is created automatically on first use. Deploy this in the
 * dedicated anniversary Google account: the one-time authorization covers
 * that account's (otherwise empty) Drive, and nothing else.
 */

var ROOT_FOLDER_NAME = 'Souvenirs — 50 ans Chris & Mus';
var PHOTOS_FOLDER_NAME = '📷 Photos';
var VIDEOS_FOLDER_NAME = '🎥 Vidéos';
var TMP_FOLDER_NAME = '_technique — ne pas toucher';
var LOG_SPREADSHEET_NAME = '📒 Journal des contributions — 50 ans Chris & Mus';

/**
 * JSON API called by the page hosted on GitHub Pages.
 * Requests: POST { action: 'uploadFile'|'uploadVideoChunk'|'finalizeSubmission', payload: {...} }
 * Responses: { ok: true, ...result } or { ok: false, error: '...' }
 */
function doPost(e) {
  var res;
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.action === 'uploadFile') res = uploadFile(req.payload);
    else if (req.action === 'uploadVideoChunk') res = uploadVideoChunk(req.payload);
    else if (req.action === 'finalizeSubmission') res = finalizeSubmission(req.payload);
    else throw new Error('Action inconnue');
    res.ok = true;
  } catch (err) {
    res = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('chrismus50 — le service fonctionne ✓');
}

/**
 * Stores one photo in 📷 Photos as "Prénom — <index>.<ext>".
 * payload: { contributorName, index (1-based), fileName, mimeType, data (base64) }
 */
function uploadFile(payload) {
  var name = cleanName_(payload.contributorName);
  var ext = extensionFor_(payload.fileName, payload.mimeType, 'jpg');
  var fileName = name + ' — ' + (parseInt(payload.index, 10) || 1) + '.' + ext;
  var bytes = Utilities.base64Decode(payload.data);
  var blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', fileName);
  getSubFolder_('PHOTOS_FOLDER_ID', PHOTOS_FOLDER_NAME).createFile(blob);
  return {};
}

/**
 * Stores one piece of a video message. Videos can exceed what a single POST
 * can carry, so the browser sends them in ~3 MB chunks; each chunk lands as a
 * temp file in the technical folder, and when the last one arrives they are
 * merged into "🎥 Vidéos/Message de Prénom.<ext>" and the temps are trashed.
 *
 * payload: { contributorName, uploadId, seq, isLast, mimeType, fileName, data }
 */
function uploadVideoChunk(payload) {
  var tmp = getSubFolder_('TMP_FOLDER_ID', TMP_FOLDER_NAME);
  var chunkName = '~chunk_' + payload.uploadId + '_' + ('000' + payload.seq).slice(-3);
  tmp.createFile(Utilities.newBlob(
    Utilities.base64Decode(payload.data), 'application/octet-stream', chunkName));
  if (!payload.isLast) return {};

  // Last chunk: merge this uploadId's chunks in order into the final video.
  var prefix = '~chunk_' + payload.uploadId + '_';
  var dayMs = 24 * 60 * 60 * 1000;
  var parts = [];
  var mine = [];
  var seen = {};
  var it = tmp.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var n = f.getName();
    if (n.indexOf(prefix) === 0) {
      mine.push(f);
      var seq = parseInt(n.slice(prefix.length), 10);
      if (!seen[seq]) { // a retried call may have written the same chunk twice
        seen[seq] = true;
        parts.push({ seq: seq, file: f });
      }
    } else if (new Date() - f.getLastUpdated() > dayMs) {
      f.setTrashed(true); // orphan from an abandoned upload; other visitors' live chunks stay
    }
  }
  if (parts.length !== payload.seq + 1) {
    throw new Error('Morceaux manquants (' + parts.length + '/' + (payload.seq + 1) + ')');
  }
  parts.sort(function (a, b) { return a.seq - b.seq; });
  var bytes = [];
  parts.forEach(function (p) { bytes = bytes.concat(p.file.getBlob().getBytes()); });

  var name = cleanName_(payload.contributorName);
  var ext = extensionFor_(payload.fileName, payload.mimeType, 'mp4');
  getSubFolder_('VIDEOS_FOLDER_ID', VIDEOS_FOLDER_NAME).createFile(
    Utilities.newBlob(bytes, payload.mimeType || 'video/mp4', 'Message de ' + name + '.' + ext));
  mine.forEach(function (f) { f.setTrashed(true); });
  return { done: true };
}

/**
 * Called once per submission, after all photos and the video are uploaded.
 * payload: { contributorName, message, fileCount, hasVideo }
 */
function finalizeSubmission(payload) {
  var name = cleanName_(payload.contributorName);
  var message = String(payload.message || '').trim().slice(0, 5000);
  var sheet = getLogSheet_();
  withScriptLock_(function () {
    sheet.appendRow([new Date(), name, message,
                     payload.fileCount || 0, payload.hasVideo ? 'Oui' : 'Non']);
  });
  return {};
}

/* ---------- internals ---------- */

function cleanName_(raw) {
  // Keep it friendly in filenames: no path separators or exotic control chars.
  return String(raw || 'Inconnu').trim().replace(/[\/\\:*?"<>|~]/g, ' ')
    .replace(/\s+/g, ' ').slice(0, 60) || 'Inconnu';
}

function extensionFor_(fileName, mimeType, fallback) {
  var m = /\.([a-zA-Z0-9]{1,5})$/.exec(String(fileName || ''));
  if (m) return m[1].toLowerCase();
  var map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic',
              'image/gif': 'gif', 'image/webp': 'webp',
              'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
  return map[String(mimeType || '').split(';')[0]] || fallback;
}

function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function getRootFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('ROOT_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* was deleted; recreate */ }
  }
  return withScriptLock_(function () {
    var again = props.getProperty('ROOT_FOLDER_ID');
    if (again) {
      try { return DriveApp.getFolderById(again); } catch (e) { /* recreate */ }
    }
    var folder = DriveApp.createFolder(ROOT_FOLDER_NAME);
    props.setProperty('ROOT_FOLDER_ID', folder.getId());
    return folder;
  });
}

/** Get-or-create a subfolder of the root, cached in script properties. */
function getSubFolder_(propKey, folderName) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(propKey);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* recreate */ }
  }
  var root = getRootFolder_(); // resolve before taking the lock (it locks internally)
  return withScriptLock_(function () {
    var again = props.getProperty(propKey);
    if (again) {
      try { return DriveApp.getFolderById(again); } catch (e) { /* recreate */ }
    }
    var folder = root.createFolder(folderName);
    props.setProperty(propKey, folder.getId());
    return folder;
  });
}

function getLogSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('LOG_SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) { /* recreate */ }
  }
  var root = getRootFolder_(); // resolve before taking the lock (it locks internally)
  return withScriptLock_(function () {
    var again = props.getProperty('LOG_SPREADSHEET_ID');
    if (again) {
      try { return SpreadsheetApp.openById(again).getSheets()[0]; } catch (e) { /* recreate */ }
    }
    var ss = SpreadsheetApp.create(LOG_SPREADSHEET_NAME);
    var sheet = ss.getSheets()[0];
    sheet.appendRow(['Envoyé le', 'Prénom', 'Message', 'Nombre de photos', 'Vidéo']);
    sheet.setFrozenRows(1);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    props.setProperty('LOG_SPREADSHEET_ID', ss.getId());
    return sheet;
  });
}

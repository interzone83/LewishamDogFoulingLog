// Dog Log Upload — Scriptable
// Canonical source for the Lewisham Dog Fouling Evidence Log.
//
// Scriptable settings:
//   Share Sheet Inputs: Images + File URLs
//   Run In App: ON
//
// New Post:
//   - preserves the original filename whenever iOS supplies it
//   - writes a 1080 x 1440 JPEG at 50% JPEG quality
//   - creates batch.json
//
// Existing Post:
//   - can add or replace evidence in the permanent-ID folder
//   - replacement uses the existing GitHub blob SHA
//   - NEVER creates batch.json

const OWNER = "interzone83";
const REPO = "LewishamDogFoulingLog";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const TOKEN_KEY = "LewishamDogLogGitHubToken";

const TARGET_W = 1080;
const TARGET_H = 1440;
const JPEG_QUALITY = 0.5;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timestamp(d = new Date()) {
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    "-" +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function filenameFromURL(url) {
  if (!url) return null;
  let text = String(url).split("?")[0];
  text = text.substring(text.lastIndexOf("/") + 1);
  try { return decodeURIComponent(text); }
  catch { return text; }
}

function jpegName(name) {
  if (!name) return null;
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

function isImageName(name) {
  return /\.(jpe?g|png|heic|webp)$/i.test(name || "");
}

async function showMessage(title, message) {
  const a = new Alert();
  a.title = title;
  a.message = message;
  a.addAction("OK");
  await a.presentAlert();
}

async function confirmGeneratedNames() {
  const a = new Alert();
  a.title = "Original filenames unavailable";
  a.message =
    "iOS did not supply the original photo filename(s). To preserve IMG_… names, cancel this upload and use a File URL-enabled share/launcher. Continue only if generated names are acceptable.";
  a.addAction("Use generated names");
  a.addCancelAction("Cancel");
  return (await a.presentAlert()) === 0;
}

async function chooseMode() {
  const a = new Alert();
  a.title = "Dog Log Upload";
  a.message = "Where should these photos go?";
  a.addAction("New Post");
  a.addAction("Existing Post");
  a.addCancelAction("Cancel");
  const n = await a.presentSheet();
  if (n === 0) return "new";
  if (n === 1) return "existing";
  return null;
}

async function askPostID() {
  const a = new Alert();
  a.title = "Existing Post";
  a.message = "Enter the permanent Post ID, e.g. LEGACY-023 or DOGLOG-20261001-101949.";
  a.addTextField("Post ID", "");
  a.addAction("Continue");
  a.addCancelAction("Cancel");
  const n = await a.presentAlert();
  if (n < 0) return null;
  const value = a.textFieldValue(0).trim().toUpperCase();
  return value || null;
}

async function getToken() {
  if (Keychain.contains(TOKEN_KEY)) return Keychain.get(TOKEN_KEY);

  const a = new Alert();
  a.title = "GitHub Token";
  a.message =
    "Paste the fine-grained GitHub token used for this repository. Scriptable will keep it in the encrypted Keychain.";
  a.addSecureTextField("GitHub token", "");
  a.addAction("Save");
  a.addCancelAction("Cancel");

  const n = await a.presentAlert();
  if (n < 0) return null;

  const token = a.textFieldValue(0).trim();
  if (!token) return null;

  Keychain.set(TOKEN_KEY, token);
  return token;
}

async function gh(token, path, method = "GET", body = null, allow404 = false) {
  const r = new Request(API + path);
  r.method = method;
  r.headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
  if (body !== null) r.body = JSON.stringify(body);

  let text = "";
  try {
    text = await r.loadString();
  } catch (e) {
    const status = r.response ? r.response.statusCode : 0;
    if (allow404 && status === 404) return { status, data: null };
    throw new Error(`GitHub request failed${status ? ` (${status})` : ""}`);
  }

  const status = r.response ? r.response.statusCode : 0;
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }

  if (allow404 && status === 404) return { status, data: null };

  if (status < 200 || status >= 300) {
    const msg = data && data.message ? data.message : String(text || "Unknown GitHub error");
    throw new Error(`GitHub ${status}: ${msg}`);
  }

  return { status, data };
}

async function verifyToken(token) {
  await gh(token, "", "GET");
}

function resizeToEvidenceStandard(image) {
  const ctx = new DrawContext();
  ctx.size = new Size(TARGET_W, TARGET_H);
  ctx.respectScreenScale = false;
  ctx.opaque = true;

  ctx.setFillColor(new Color("#ffffff"));
  ctx.fillRect(new Rect(0, 0, TARGET_W, TARGET_H));

  const scale = Math.min(TARGET_W / image.size.width, TARGET_H / image.size.height);
  const w = image.size.width * scale;
  const h = image.size.height * scale;

  ctx.drawImageInRect(
    image,
    new Rect((TARGET_W - w) / 2, (TARGET_H - h) / 2, w, h)
  );

  return ctx.getImage();
}

function imageToBase64(image) {
  return Data.fromJPEG(image, JPEG_QUALITY).toBase64String();
}

async function putFile(token, repoPath, base64Content, message, sha = null) {
  const payload = {
    message,
    content: base64Content,
    branch: BRANCH
  };
  if (sha) payload.sha = sha;

  const result = await gh(
    token,
    `/contents/${encodePath(repoPath)}`,
    "PUT",
    payload
  );

  return result.data;
}

async function listFolder(token, postID) {
  const result = await gh(
    token,
    `/contents/${encodePath(`images/${postID}`)}?ref=${encodeURIComponent(BRANCH)}`,
    "GET",
    null,
    true
  );

  if (result.status === 404 || !Array.isArray(result.data)) return [];

  return result.data
    .filter(x => x.type === "file" && isImageName(x.name))
    .map(x => ({ name: x.name, path: x.path, sha: x.sha }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function chooseFileToReplace(files) {
  if (!files.length) return null;

  const a = new Alert();
  a.title = "Choose existing photo";
  a.message = "Select the GitHub image that this new photo should replace.";
  for (const f of files) a.addAction(f.name);
  a.addCancelAction("Cancel");

  const n = await a.presentSheet();
  return n < 0 ? null : files[n];
}

async function chooseExistingAction(files, suggestedName, number, total, replaceAll) {
  const exact = suggestedName
    ? files.find(f => f.name.toLowerCase() === suggestedName.toLowerCase())
    : null;

  if (exact && replaceAll) {
    return { action: "replace", file: exact, replaceAll: true };
  }

  if (exact) {
    const a = new Alert();
    a.title = `Photo ${number} of ${total}`;
    a.message = `${exact.name} already exists.`;
    a.addDestructiveAction("Replace");
    a.addAction("Replace All Matching Names");
    a.addAction("Choose Different File");
    a.addAction("Add as New Photo");
    a.addCancelAction("Skip");

    const n = await a.presentSheet();

    if (n === 0) return { action: "replace", file: exact, replaceAll };
    if (n === 1) return { action: "replace", file: exact, replaceAll: true };

    if (n === 2) {
      const chosen = await chooseFileToReplace(files);
      return chosen
        ? { action: "replace", file: chosen, replaceAll }
        : { action: "skip", replaceAll };
    }

    if (n === 3) return { action: "add", replaceAll };
    return { action: "skip", replaceAll };
  }

  if (!files.length) return { action: "add", replaceAll };

  const a = new Alert();
  a.title = `Photo ${number} of ${total}`;
  a.message = suggestedName
    ? `${suggestedName} does not already exist.`
    : "The original filename was not supplied. Choose what to do with this photo.";
  a.addAction("Replace Existing File");
  a.addAction("Add as New Photo");
  a.addCancelAction("Skip");

  const n = await a.presentSheet();

  if (n === 0) {
    const chosen = await chooseFileToReplace(files);
    return chosen
      ? { action: "replace", file: chosen, replaceAll }
      : { action: "skip", replaceAll };
  }

  if (n === 1) return { action: "add", replaceAll };
  return { action: "skip", replaceAll };
}

function uniqueNewName(files, preferred, index) {
  const used = new Set(files.map(f => f.name.toLowerCase()));
  let name = preferred || `photo-${timestamp()}-${pad2(index + 1)}.jpg`;

  if (!used.has(name.toLowerCase())) return name;

  const stem = name.replace(/\.jpg$/i, "");
  let n = 2;
  while (used.has(`${stem}-${n}.jpg`.toLowerCase())) n++;

  return `${stem}-${n}.jpg`;
}

const sharedImages = args.images || [];
const sharedFileURLs = args.fileURLs || [];

let inputs = [];

if (sharedImages.length) {
  inputs = sharedImages.map((image, i) => ({
    image,
    originalName: filenameFromURL(sharedFileURLs[i])
  }));
} else if (sharedFileURLs.length) {
  for (const url of sharedFileURLs) {
    const path = String(url).replace(/^file:\/\//, "");
    const image = Image.fromFile(path);
    if (image) {
      inputs.push({
        image,
        originalName: filenameFromURL(url)
      });
    }
  }
}

if (!inputs.length) {
  await showMessage(
    "No Images",
    "Share one or more photos to this script. In Scriptable settings, enable both Images and File URLs as Share Sheet inputs."
  );
  Script.complete();
} else {
  const mode = await chooseMode();

  if (!mode) {
    Script.complete();
  } else {
    const token = await getToken();

    if (!token) {
      Script.complete();
    } else {
      try {
        await verifyToken(token);
      } catch (e) {
        if (Keychain.contains(TOKEN_KEY)) Keychain.remove(TOKEN_KEY);
        await showMessage("GitHub Connection Failed", String(e));
        Script.complete();
        return;
      }

      try {
        if (mode === "new") {
          const missingNames = inputs.some(x => !x.originalName);
          if (missingNames && !(await confirmGeneratedNames())) {
            Script.complete();
            return;
          }

          const postID = `DOGLOG-${timestamp()}`;

          for (let i = 0; i < inputs.length; i++) {
            const resized = resizeToEvidenceStandard(inputs[i].image);
            const filename =
              jpegName(inputs[i].originalName) ||
              `photo-${pad2(i + 1)}.jpg`;

            await putFile(
              token,
              `images/${postID}/${filename}`,
              imageToBase64(resized),
              "New dog fouling report"
            );
          }

          const marker = JSON.stringify({ batchid: postID, status: "pending" });

          await putFile(
            token,
            `images/${postID}/batch.json`,
            Data.fromString(marker).toBase64String(),
            "Create pending dog log batch"
          );

          Pasteboard.copyString(postID);

          await showMessage(
            "Upload Complete",
            `${inputs.length} photo${inputs.length === 1 ? "" : "s"} uploaded.\n\n${postID}\n\nThe Post ID has been copied to the clipboard.`
          );
        } else {
          const postID = await askPostID();

          if (!postID) {
            Script.complete();
            return;
          }

          let files = await listFolder(token, postID);
          let replaced = 0;
          let added = 0;
          let skipped = 0;
          let replaceAll = false;

          for (let i = 0; i < inputs.length; i++) {
            const resized = resizeToEvidenceStandard(inputs[i].image);
            const suggestedName = jpegName(inputs[i].originalName);

            const choice = await chooseExistingAction(
              files,
              suggestedName,
              i + 1,
              inputs.length,
              replaceAll
            );

            replaceAll = choice.replaceAll;

            if (choice.action === "skip") {
              skipped++;
              continue;
            }

            if (choice.action === "replace") {
              const result = await putFile(
                token,
                choice.file.path,
                imageToBase64(resized),
                `Replace dog log evidence photo for ${postID}`,
                choice.file.sha
              );

              if (result && result.content && result.content.sha) {
                choice.file.sha = result.content.sha;
              }

              replaced++;
              continue;
            }

            if (!suggestedName && !(await confirmGeneratedNames())) {
              skipped++;
              continue;
            }

            const filename = uniqueNewName(files, suggestedName, i);
            const path = `images/${postID}/${filename}`;

            const result = await putFile(
              token,
              path,
              imageToBase64(resized),
              `Add dog log evidence photo for ${postID}`
            );

            files.push({
              name: filename,
              path,
              sha: result && result.content ? result.content.sha : null
            });
            files.sort((a, b) => a.name.localeCompare(b.name));
            added++;
          }

          await showMessage(
            "Existing Post Updated",
            `${postID}\n\nReplaced: ${replaced}\nAdded: ${added}\nSkipped: ${skipped}\n\nNo batch.json was created.`
          );
        }
      } catch (e) {
        await showMessage("Upload Failed", String(e));
      }

      Script.complete();
    }
  }
}

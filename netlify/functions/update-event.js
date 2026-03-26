const fetch = globalThis.fetch;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      "Access-Control-Allow-Methods": "OPTIONS, POST"
    },
    body: JSON.stringify(body)
  };
}

function getConfig() {
  const required = [
    "GITHUB_TOKEN",
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "GITHUB_BRANCH",
    "GITHUB_FILE_PATH",
    "ADMIN_KEY"
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error("Variables d'environnement manquantes : " + missing.join(", "));
  }
  return {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH,
    filePath: process.env.GITHUB_FILE_PATH,
    adminKey: process.env.ADMIN_KEY
  };
}

async function getGithubFile(config) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${config.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "netlify-function"
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Impossible de lire le fichier GitHub.");
  }

  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  return {
    sha: data.sha,
    content: JSON.parse(decoded)
  };
}

async function updateGithubFile(config, nextContent, sha, message) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(nextContent, null, 2), "utf8").toString("base64"),
    sha,
    branch: config.branch
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${config.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "netlify-function",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Impossible d'écrire le fichier GitHub.");
  }

  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Méthode non autorisée." });
  }

  try {
    const config = getConfig();
    const sentKey = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
    if (sentKey !== config.adminKey) {
      return jsonResponse(401, { ok: false, error: "Clé admin invalide." });
    }

    const payload = JSON.parse(event.body || "{}");
    const id = Number(payload.id);

    if (!id) {
      return jsonResponse(400, { ok: false, error: "ID événement manquant." });
    }

    const { sha, content } = await getGithubFile(config);
    if (!content || !Array.isArray(content.events)) {
      throw new Error("Le fichier events.json est invalide.");
    }

    const idx = json.events.findIndex(e => String(e.id) === String(payload.id));
    if (idx === -1) {
      return jsonResponse(404, { ok: false, error: "Événement introuvable." });
    }

    const current = content.events[idx];
    const updated = {
      ...current,
      ...(typeof payload.g === "string" ? { g: payload.g.trim() } : {}),
      ...(typeof payload.bu === "string" ? { bu: payload.bu.trim() } : {}),
      ...(typeof payload.e === "string" ? { e: payload.e.trim() } : {}),
      ...(typeof payload.n === "string" ? { n: payload.n.trim() } : {}),
      ...(payload.m ? { m: Number(payload.m) } : {}),
      ...(typeof payload.t === "string" ? { t: payload.t.trim() } : {})
    };

    content.events[idx] = updated;
    content.meta = content.meta || {};
    content.meta.updated_at = new Date().toISOString();

    await updateGithubFile(
      config,
      content,
      sha,
      `update event ${id}`
    );

    return jsonResponse(200, { ok: true, event: updated, updated_at: content.meta.updated_at });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || "Erreur serveur." });
  }
};

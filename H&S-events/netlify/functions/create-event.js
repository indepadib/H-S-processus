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
  if (!res.ok) throw new Error(data?.message || "Lecture GitHub impossible.");
  return {
    sha: data.sha,
    content: JSON.parse(Buffer.from(data.content, "base64").toString("utf8"))
  };
}

async function updateGithubFile(config, nextContent, sha, message) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${config.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "netlify-function",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(nextContent, null, 2), "utf8").toString("base64"),
      sha,
      branch: config.branch
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Écriture GitHub impossible.");
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true });
  if (event.httpMethod !== "POST") return jsonResponse(405, { ok: false, error: "Méthode non autorisée." });

  try {
    const config = getConfig();
    const sentKey = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
    if (sentKey !== config.adminKey) return jsonResponse(401, { ok: false, error: "Clé admin invalide." });

    const payload = JSON.parse(event.body || "{}");
    if (!payload.g || !payload.n || !payload.m || !payload.t) {
      return jsonResponse(400, { ok: false, error: "Champs requis : g, n, m, t." });
    }

    const { sha, content } = await getGithubFile(config);
    const newId = Number(content.nxtId || 1);
    const newEvent = {
      id: newId,
      g: String(payload.g || "").trim(),
      bu: String(payload.bu || "").trim(),
      e: String(payload.e || "").trim(),
      n: String(payload.n || "").trim(),
      m: Number(payload.m),
      t: String(payload.t || "").trim()
    };

    content.events = Array.isArray(content.events) ? content.events : [];
    content.events.push(newEvent);
    content.nxtId = newId + 1;
    content.meta = content.meta || {};
    content.meta.updated_at = new Date().toISOString();

    await updateGithubFile(config, content, sha, `create event ${newId}`);

    return jsonResponse(200, { ok: true, event: newEvent, nxtId: content.nxtId });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || "Erreur serveur." });
  }
};

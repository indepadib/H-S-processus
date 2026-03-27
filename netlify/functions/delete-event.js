const GITHUB_API = "https://api.github.com";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return response(405, { error: "Method not allowed" });
    }

    const {
      GITHUB_TOKEN,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_BRANCH = "main",
      GITHUB_FILE_PATH = "H&S-events/events.json",
      ADMIN_KEY
    } = process.env;

    const sentKey =
      event.headers["x-admin-key"] ||
      event.headers["X-Admin-Key"] ||
      "";

    if (!ADMIN_KEY || sentKey !== ADMIN_KEY) {
      return response(401, { error: "Clé admin invalide." });
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return response(500, { error: "Variables GitHub manquantes." });
    }

    const payload = JSON.parse(event.body || "{}");
    if (!payload.id) {
      return response(400, { error: "id requis." });
    }

    const file = await getFile({
      token: GITHUB_TOKEN,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE_PATH,
      branch: GITHUB_BRANCH
    });

    const raw = Buffer.from(file.content, "base64").toString("utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data.events)) {
      return response(500, { error: "events.json invalide." });
    }

    const before = data.events.length;
    data.events = data.events.filter(
      (e) => String(e.id) !== String(payload.id)
    );

    if (data.events.length === before) {
      return response(404, { error: "Événement introuvable." });
    }

    data.updated_at = new Date().toISOString();

    await putFile({
      token: GITHUB_TOKEN,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE_PATH,
      branch: GITHUB_BRANCH,
      sha: file.sha,
      message: `delete event ${payload.id}`,
      content: JSON.stringify(data, null, 2)
    });

    return response(200, {
      success: true,
      deletedId: payload.id
    });
  } catch (err) {
    return response(500, {
      error: err.message || "Erreur delete-event"
    });
  }
};

async function getFile({ token, owner, repo, path, branch }) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Lecture GitHub impossible: ${res.status} ${txt}`);
  }

  return await res.json();
}

async function putFile({ token, owner, repo, path, branch, sha, message, content }) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sha,
        branch,
        content: Buffer.from(content, "utf8").toString("base64")
      })
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Écriture GitHub impossible: ${res.status} ${txt}`);
  }

  return await res.json();
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

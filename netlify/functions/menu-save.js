exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Ici tu peux ajouter une vraie sécurité serveur:
  // - vérification d'un token
  // - Netlify Identity / JWT
  // - enregistrement vers Supabase / blob / GitHub

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, message: "Sauvegarde reçue. Branche ici ta vraie logique serveur." })
  };
};

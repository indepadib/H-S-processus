exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, message: "Brancher ici la lecture de ton catalogue depuis un JSON, une base ou Supabase." })
  };
};

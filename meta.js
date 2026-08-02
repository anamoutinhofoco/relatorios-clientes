const GRAPH = 'https://graph.facebook.com/v20.0';

function sanitizeToken(raw) {
  if (!raw) return '';
  let t = raw.trim();
  // strip surrounding quotes accidentally kept when pasting into Vercel's env var UI
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  // strip an accidental "Bearer " prefix
  t = t.replace(/^Bearer\s+/i, '').trim();
  return t;
}

module.exports = async function handler(req, res) {
  const token = sanitizeToken(process.env.TOKEN_META);
  if (!token) {
    res.status(500).json({ error: { message: 'TOKEN_META não configurado (ou vazio) nas variáveis de ambiente do Vercel.' } });
    return;
  }
  if (/\s/.test(token)) {
    res.status(500).json({ error: { message: 'TOKEN_META contém espaços/quebras de linha inválidos. Copie o token novamente sem espaços extras e salve a variável no Vercel.' } });
    return;
  }

  const { path, ...params } = req.query;
  if (!path) {
    res.status(400).json({ error: { message: 'Parâmetro "path" é obrigatório.' } });
    return;
  }

  const url = new URL(`${GRAPH}/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    url.searchParams.set(k, Array.isArray(v) ? v[0] : v);
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: { message: e.message } });
  }
};

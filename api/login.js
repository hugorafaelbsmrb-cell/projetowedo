export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;
    if (username === 'admin' && password === '123') {
      res.status(200).json({ success: true, user: { username: 'admin' } });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
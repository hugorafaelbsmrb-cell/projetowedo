export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      appName: "CodeKids",
      logoType: "text",
      logoUrl: ""
    });
  } else if (req.method === 'POST') {
    res.status(200).json({ 
        success: true, 
        warning: "Vercel is read-only. Data saved in browser (LocalStorage) only." 
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
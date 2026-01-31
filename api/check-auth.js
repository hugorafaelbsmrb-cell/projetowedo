export default function handler(req, res) {
    // Vercel serverless is stateless. Client should handle auth via LocalStorage.
    res.status(200).json({ authenticated: false });
}
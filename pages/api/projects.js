import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    // Créer la table projects si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        city VARCHAR(100),
        budget DECIMAL(12,2),
        currency VARCHAR(10) DEFAULT 'EUR',
        property_type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (req.method === "GET") {
      const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
      res.json({ success: true, projects, message: "DealPilot + Neon fonctionne !" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Récupérer tous les projets avec totaux agrégés
      const projects = await sql`
        SELECT
          p.*,
          COALESCE((SELECT SUM(amount) FROM costs WHERE project_id = p.id), 0) AS total_costs,
          COALESCE((SELECT SUM(estimated_amount) FROM works WHERE project_id = p.id), 0) AS total_works_estimated,
          COALESCE((SELECT SUM(actual_amount) FROM works WHERE project_id = p.id), 0) AS total_works_actual,
          (SELECT COUNT(*) FROM contacts WHERE project_id = p.id) AS contacts_count
        FROM projects p
        ORDER BY p.created_at DESC
      `;
      return res.json({ success: true, projects });
    }

    if (req.method === "POST") {
      const { name, country, city, address, propertyType, description, currency, targetBudget, status } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: "Le nom est requis" });
      }

      const [project] = await sql`
        INSERT INTO projects (name, country, city, address, property_type, description, currency, target_budget, status)
        VALUES (
          ${name},
          ${country || null},
          ${city || null},
          ${address || null},
          ${propertyType || null},
          ${description || null},
          ${currency || "MAD"},
          ${targetBudget || null},
          ${status || "prospection"}
        )
        RETURNING *
      `;

      return res.json({ success: true, project });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("API projects error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

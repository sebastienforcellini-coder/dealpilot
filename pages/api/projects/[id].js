import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  const { id } = req.query;
  const projectId = parseInt(id, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: "ID invalide" });
  }

  try {
    if (req.method === "GET") {
      const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`;

      if (!project) {
        return res.status(404).json({ success: false, error: "Projet introuvable" });
      }

      const contacts = await sql`SELECT * FROM contacts WHERE project_id = ${projectId} ORDER BY type, name`;
      const costs = await sql`SELECT * FROM costs WHERE project_id = ${projectId} ORDER BY category, id`;
      const works = await sql`SELECT * FROM works WHERE project_id = ${projectId} ORDER BY category, id`;
      const timeline = await sql`SELECT * FROM timeline_events WHERE project_id = ${projectId} ORDER BY event_date ASC`;

      // Récupère les interactions pour tous les contacts du projet
      const contactIds = contacts.map((c) => c.id);
      let interactions = [];
      if (contactIds.length > 0) {
        interactions = await sql`
          SELECT * FROM contact_interactions
          WHERE contact_id = ANY(${contactIds})
          ORDER BY interaction_date DESC
        `;
      }

      return res.json({
        success: true,
        project,
        contacts,
        interactions,
        costs,
        works,
        timeline,
      });
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const fields = req.body;

      // Whitelist des champs modifiables
      const allowed = ["name", "country", "city", "address", "property_type", "description", "status", "currency", "target_budget"];
      const payload = {};
      for (const k of allowed) {
        if (k in fields) payload[k] = fields[k];
      }

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ success: false, error: "Aucun champ à mettre à jour" });
      }

      // Mise à jour avec des requêtes dédiées par champ (approche simple, compatible Neon serverless)
      const p = payload;
      if ("name" in p) await sql`UPDATE projects SET name = ${p.name}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("country" in p) await sql`UPDATE projects SET country = ${p.country}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("city" in p) await sql`UPDATE projects SET city = ${p.city}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("address" in p) await sql`UPDATE projects SET address = ${p.address}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("property_type" in p) await sql`UPDATE projects SET property_type = ${p.property_type}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("description" in p) await sql`UPDATE projects SET description = ${p.description}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("status" in p) await sql`UPDATE projects SET status = ${p.status}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("currency" in p) await sql`UPDATE projects SET currency = ${p.currency}, updated_at = NOW() WHERE id = ${projectId}`;
      if ("target_budget" in p) await sql`UPDATE projects SET target_budget = ${p.target_budget}, updated_at = NOW() WHERE id = ${projectId}`;

      const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
      return res.json({ success: true, project });
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM projects WHERE id = ${projectId}`;
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("API project [id] error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
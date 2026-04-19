import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    // POST : associer un contact existant à un projet
    if (req.method === "POST") {
      const {
        project_id,
        contact_id,
        project_role,
        commission_percentage,
        commission_amount,
        notes,
      } = req.body;

      if (!project_id || !contact_id) {
        return res.status(400).json({
          success: false,
          error: "project_id et contact_id sont obligatoires",
        });
      }

      // Vérifier si l'association existe déjà
      const existing = await sql`
        SELECT id FROM project_contacts
        WHERE project_id = ${Number(project_id)} AND contact_id = ${Number(contact_id)}
      `;
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: "Ce contact est déjà associé à ce projet",
        });
      }

      const [link] = await sql`
        INSERT INTO project_contacts (
          project_id, contact_id, project_role,
          commission_percentage, commission_amount, notes
        ) VALUES (
          ${Number(project_id)},
          ${Number(contact_id)},
          ${project_role || null},
          ${commission_percentage ? Number(commission_percentage) : null},
          ${commission_amount ? Number(commission_amount) : null},
          ${notes || null}
        )
        RETURNING *
      `;

      return res.json({ success: true, association: link });
    }

    // PATCH : modifier une association (commission projet, rôle projet...)
    if (req.method === "PATCH" || req.method === "PUT") {
      const { association_id } = req.query;
      if (!association_id) {
        return res.status(400).json({ success: false, error: "association_id requis" });
      }
      const id = Number(association_id);
      const p = req.body || {};

      if ("project_role" in p) await sql`UPDATE project_contacts SET project_role = ${p.project_role || null}, updated_at = NOW() WHERE id = ${id}`;
      if ("commission_percentage" in p) await sql`UPDATE project_contacts SET commission_percentage = ${p.commission_percentage ? Number(p.commission_percentage) : null}, updated_at = NOW() WHERE id = ${id}`;
      if ("commission_amount" in p) await sql`UPDATE project_contacts SET commission_amount = ${p.commission_amount ? Number(p.commission_amount) : null}, updated_at = NOW() WHERE id = ${id}`;
      if ("notes" in p) await sql`UPDATE project_contacts SET notes = ${p.notes || null}, updated_at = NOW() WHERE id = ${id}`;

      const [association] = await sql`SELECT * FROM project_contacts WHERE id = ${id}`;
      return res.json({ success: true, association });
    }

    // DELETE : délier un contact d'un projet (le contact reste dans le carnet)
    if (req.method === "DELETE") {
      const { association_id } = req.query;
      if (!association_id) {
        return res.status(400).json({ success: false, error: "association_id requis" });
      }
      await sql`DELETE FROM project_contacts WHERE id = ${Number(association_id)}`;
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API project_contacts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
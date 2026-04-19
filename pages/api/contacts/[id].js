import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  const contactId = Number(req.query.id);

  if (!contactId) {
    return res.status(400).json({ success: false, error: "ID contact manquant" });
  }

  try {
    // GET : retourner un contact + ses interactions + ses projets associés
    if (req.method === "GET") {
      const [contact] = await sql`SELECT * FROM contacts WHERE id = ${contactId}`;
      if (!contact) {
        return res.status(404).json({ success: false, error: "Contact non trouvé" });
      }
      const interactions = await sql`
        SELECT * FROM contact_interactions
        WHERE contact_id = ${contactId}
        ORDER BY interaction_date DESC
      `;
      const projects = await sql`
        SELECT p.id, p.name, pc.project_role, pc.commission_percentage, pc.commission_amount
        FROM project_contacts pc
        INNER JOIN projects p ON p.id = pc.project_id
        WHERE pc.contact_id = ${contactId}
      `;
      return res.json({ success: true, contact, interactions, projects });
    }

    // PATCH : modifier les infos du contact (carnet global)
    if (req.method === "PATCH" || req.method === "PUT") {
      const p = req.body || {};

      if ("type" in p) await sql`UPDATE contacts SET type = ${p.type}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("name" in p) await sql`UPDATE contacts SET name = ${p.name}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("company" in p) await sql`UPDATE contacts SET company = ${p.company || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("role" in p) await sql`UPDATE contacts SET role = ${p.role || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("email" in p) await sql`UPDATE contacts SET email = ${p.email || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("phone" in p) await sql`UPDATE contacts SET phone = ${p.phone || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("address" in p) await sql`UPDATE contacts SET address = ${p.address || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("iban" in p) await sql`UPDATE contacts SET iban = ${p.iban || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("website" in p) await sql`UPDATE contacts SET website = ${p.website || null}, updated_at = NOW() WHERE id = ${contactId}`;
      if ("notes" in p) await sql`UPDATE contacts SET notes = ${p.notes || null}, updated_at = NOW() WHERE id = ${contactId}`;

      const [contact] = await sql`SELECT * FROM contacts WHERE id = ${contactId}`;
      return res.json({ success: true, contact });
    }

    // DELETE : supprimer complètement le contact du carnet (+ toutes associations + interactions en cascade)
    if (req.method === "DELETE") {
      await sql`DELETE FROM contacts WHERE id = ${contactId}`;
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API contact:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
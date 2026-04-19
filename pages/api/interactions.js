import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    // POST : créer une interaction
    if (req.method === "POST") {
      const { contact_id, interaction_date, type, subject, notes } = req.body;

      if (!contact_id || !type) {
        return res.status(400).json({
          success: false,
          error: "contact_id et type sont obligatoires",
        });
      }

      const [interaction] = await sql`
        INSERT INTO contact_interactions (contact_id, interaction_date, type, subject, notes)
        VALUES (
          ${contact_id},
          ${interaction_date || new Date().toISOString()},
          ${type},
          ${subject || null},
          ${notes || null}
        )
        RETURNING *
      `;

      return res.json({ success: true, interaction });
    }

    // DELETE : supprimer une interaction (via ?id=X)
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID manquant" });
      }
      await sql`DELETE FROM contact_interactions WHERE id = ${Number(id)}`;
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API interactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
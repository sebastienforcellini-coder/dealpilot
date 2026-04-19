import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  const costId = Number(req.query.id);

  if (!costId) {
    return res.status(400).json({ success: false, error: "ID coût manquant" });
  }

  try {
    // GET : retourner un coût
    if (req.method === "GET") {
      const [cost] = await sql`SELECT * FROM costs WHERE id = ${costId}`;
      if (!cost) {
        return res.status(404).json({ success: false, error: "Coût non trouvé" });
      }
      return res.json({ success: true, cost });
    }

    // PATCH : modifier un coût
    if (req.method === "PATCH" || req.method === "PUT") {
      const p = req.body || {};

      if ("category" in p) await sql`UPDATE costs SET category = ${p.category}, updated_at = NOW() WHERE id = ${costId}`;
      if ("label" in p) await sql`UPDATE costs SET label = ${p.label}, updated_at = NOW() WHERE id = ${costId}`;
      if ("amount" in p) await sql`UPDATE costs SET amount = ${p.amount ? Number(p.amount) : 0}, updated_at = NOW() WHERE id = ${costId}`;
      if ("currency" in p) await sql`UPDATE costs SET currency = ${p.currency}, updated_at = NOW() WHERE id = ${costId}`;
      if ("percentage" in p) await sql`UPDATE costs SET percentage = ${p.percentage ? Number(p.percentage) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("base_amount" in p) await sql`UPDATE costs SET base_amount = ${p.base_amount ? Number(p.base_amount) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("tax_rate" in p) await sql`UPDATE costs SET tax_rate = ${p.tax_rate ? Number(p.tax_rate) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("fixed_fee" in p) await sql`UPDATE costs SET fixed_fee = ${p.fixed_fee ? Number(p.fixed_fee) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("input_mode" in p) await sql`UPDATE costs SET input_mode = ${p.input_mode || "amount"}, updated_at = NOW() WHERE id = ${costId}`;
      if ("type_key" in p) await sql`UPDATE costs SET type_key = ${p.type_key || null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("contact_id" in p) await sql`UPDATE costs SET contact_id = ${p.contact_id ? Number(p.contact_id) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("status" in p) await sql`UPDATE costs SET status = ${p.status}, updated_at = NOW() WHERE id = ${costId}`;
      if ("paid" in p) await sql`UPDATE costs SET paid = ${p.paid}, updated_at = NOW() WHERE id = ${costId}`;
      if ("paid_date" in p) await sql`UPDATE costs SET paid_date = ${p.paid_date || null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("due_date" in p) await sql`UPDATE costs SET due_date = ${p.due_date || null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("compromise_date" in p) await sql`UPDATE costs SET compromise_date = ${p.compromise_date || null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("notes" in p) await sql`UPDATE costs SET notes = ${p.notes || null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("amount_official" in p) await sql`UPDATE costs SET amount_official = ${p.amount_official ? Number(p.amount_official) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("amount_cash" in p) await sql`UPDATE costs SET amount_cash = ${p.amount_cash ? Number(p.amount_cash) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("amount_cash_fees" in p) await sql`UPDATE costs SET amount_cash_fees = ${p.amount_cash_fees ? Number(p.amount_cash_fees) : null}, updated_at = NOW() WHERE id = ${costId}`;
      if ("base_reference" in p) await sql`UPDATE costs SET base_reference = ${p.base_reference || "official"}, updated_at = NOW() WHERE id = ${costId}`;
      if ("is_cash" in p) await sql`UPDATE costs SET is_cash = ${p.is_cash || false}, updated_at = NOW() WHERE id = ${costId}`;

      const [cost] = await sql`SELECT * FROM costs WHERE id = ${costId}`;
      return res.json({ success: true, cost });
    }

    // DELETE : supprimer un coût
    if (req.method === "DELETE") {
      await sql`DELETE FROM costs WHERE id = ${costId}`;
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API cost:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    // POST : créer un coût
    if (req.method === "POST") {
      const {
        project_id,
        category,
        label,
        amount,
        currency,
        percentage,
        base_amount,
        tax_rate,
        fixed_fee,
        input_mode,
        type_key,
        contact_id,
        status,
        paid,
        paid_date,
        due_date,
        compromise_date,
        notes,
        sort_order,
        amount_official,
        amount_cash,
        amount_cash_fees,
        base_reference,
        is_cash,
      } = req.body;

      if (!project_id || !category || !label) {
        return res.status(400).json({
          success: false,
          error: "project_id, category et label sont obligatoires",
        });
      }

      const [cost] = await sql`
        INSERT INTO costs (
          project_id, category, label, amount, currency, percentage,
          base_amount, tax_rate, fixed_fee, input_mode, type_key,
          contact_id, status, paid, paid_date, due_date, compromise_date, notes, sort_order,
          amount_official, amount_cash, amount_cash_fees, base_reference, is_cash
        ) VALUES (
          ${Number(project_id)},
          ${category},
          ${label},
          ${amount ? Number(amount) : 0},
          ${currency || "MAD"},
          ${percentage ? Number(percentage) : null},
          ${base_amount ? Number(base_amount) : null},
          ${tax_rate ? Number(tax_rate) : null},
          ${fixed_fee ? Number(fixed_fee) : null},
          ${input_mode || "amount"},
          ${type_key || null},
          ${contact_id ? Number(contact_id) : null},
          ${status || "estime"},
          ${paid || false},
          ${paid_date || null},
          ${due_date || null},
          ${compromise_date || null},
          ${notes || null},
          ${sort_order || 0},
          ${amount_official ? Number(amount_official) : null},
          ${amount_cash ? Number(amount_cash) : null},
          ${amount_cash_fees ? Number(amount_cash_fees) : null},
          ${base_reference || "official"},
          ${is_cash || false}
        )
        RETURNING *
      `;

      return res.json({ success: true, cost });
    }

    // GET : lister les coûts d'un projet
    if (req.method === "GET") {
      const { project_id } = req.query;
      if (!project_id) {
        return res.status(400).json({ success: false, error: "project_id requis" });
      }

      const costs = await sql`
        SELECT
          c.*,
          ct.name AS contact_name,
          ct.type AS contact_type
        FROM costs c
        LEFT JOIN contacts ct ON ct.id = c.contact_id
        WHERE c.project_id = ${Number(project_id)}
        ORDER BY c.sort_order, c.category, c.id
      `;

      return res.json({ success: true, costs });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API costs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
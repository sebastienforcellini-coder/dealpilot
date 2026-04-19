import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    // POST : créer un contact dans le carnet + associer éventuellement à un projet
    if (req.method === "POST") {
      const {
        // Données du contact (carnet global)
        type,
        name,
        company,
        role,
        email,
        phone,
        address,
        iban,
        website,
        notes,
        // Association optionnelle à un projet (avec commission spécifique)
        project_id,
        project_role,
        commission_percentage,
        commission_amount,
        project_notes,
      } = req.body;

      if (!type || !name) {
        return res.status(400).json({
          success: false,
          error: "type et name sont obligatoires",
        });
      }

      // 1. Créer le contact dans le carnet global
      const [contact] = await sql`
        INSERT INTO contacts (
          type, name, company, role, email, phone, address,
          iban, website, notes
        ) VALUES (
          ${type},
          ${name},
          ${company || null},
          ${role || null},
          ${email || null},
          ${phone || null},
          ${address || null},
          ${iban || null},
          ${website || null},
          ${notes || null}
        )
        RETURNING *
      `;

      // 2. Si un project_id est fourni, créer la liaison
      let association = null;
      if (project_id) {
        const [link] = await sql`
          INSERT INTO project_contacts (
            project_id, contact_id, project_role,
            commission_percentage, commission_amount, notes
          ) VALUES (
            ${Number(project_id)},
            ${contact.id},
            ${project_role || null},
            ${commission_percentage ? Number(commission_percentage) : null},
            ${commission_amount ? Number(commission_amount) : null},
            ${project_notes || null}
          )
          RETURNING *
        `;
        association = link;
      }

      return res.json({ success: true, contact, association });
    }

    // GET : lister les contacts
    // Si ?project_id=X : renvoie les contacts associés à ce projet avec leurs commissions projet
    // Si ?exclude_project=X : renvoie le carnet, en excluant ceux déjà liés à ce projet
    // Sinon : tout le carnet global
    if (req.method === "GET") {
      const { project_id, exclude_project } = req.query;

      if (project_id) {
        const contacts = await sql`
          SELECT
            c.*,
            pc.id AS association_id,
            pc.project_role,
            pc.commission_percentage,
            pc.commission_amount,
            pc.notes AS project_notes
          FROM contacts c
          INNER JOIN project_contacts pc ON pc.contact_id = c.id
          WHERE pc.project_id = ${Number(project_id)}
          ORDER BY c.type, c.name
        `;
        return res.json({ success: true, contacts });
      }

      if (exclude_project) {
        const contacts = await sql`
          SELECT c.* FROM contacts c
          WHERE c.id NOT IN (
            SELECT pc.contact_id FROM project_contacts pc
            WHERE pc.project_id = ${Number(exclude_project)}
          )
          ORDER BY c.type, c.name
        `;
        return res.json({ success: true, contacts });
      }

      const contacts = await sql`SELECT * FROM contacts ORDER BY type, name`;
      return res.json({ success: true, contacts });
    }

    res.status(405).json({ success: false, error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API contacts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
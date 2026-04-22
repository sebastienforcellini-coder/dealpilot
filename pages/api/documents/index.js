import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });
  }

  try {
    const projectId = Number(req.query.project_id);

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "project_id manquant ou invalide" });
    }

    // Récupère tous les documents du projet, triés par date décroissante (plus récent en premier)
    const documents = await sql`
      SELECT 
        id,
        project_id,
        category,
        filename,
        file_url,
        file_size,
        mime_type,
        notes,
        uploaded_at
      FROM project_documents
      WHERE project_id = ${projectId}
      ORDER BY uploaded_at DESC
    `;

    return res.status(200).json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (err) {
    console.error("Erreur liste documents:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Erreur serveur",
    });
  }
}

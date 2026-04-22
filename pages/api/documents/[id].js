import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ success: false, error: "ID invalide" });
  }

  const docId = Number(id);

  // DELETE — supprime le fichier du Blob + l'entrée DB
  if (req.method === "DELETE") {
    try {
      // 1. Récupère l'URL du fichier avant de le supprimer
      const existing = await sql`
        SELECT file_url FROM project_documents WHERE id = ${docId}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: "Document introuvable" });
      }

      const fileUrl = existing[0].file_url;

      // 2. Supprime le fichier de Vercel Blob
      try {
        await del(fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (blobErr) {
        // Si le fichier n'existe plus dans le Blob (déjà supprimé manuellement par ex.),
        // on continue quand même pour nettoyer la DB
        console.warn("Impossible de supprimer du Blob (peut-être déjà supprimé):", blobErr.message);
      }

      // 3. Supprime l'entrée DB
      await sql`DELETE FROM project_documents WHERE id = ${docId}`;

      return res.status(200).json({
        success: true,
        message: "Document supprimé",
      });
    } catch (err) {
      console.error("Erreur suppression document:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Erreur serveur",
      });
    }
  }

  // GET — récupère un document précis (utile pour le téléchargement / preview)
  if (req.method === "GET") {
    try {
      const result = await sql`
        SELECT * FROM project_documents WHERE id = ${docId}
      `;

      if (result.length === 0) {
        return res.status(404).json({ success: false, error: "Document introuvable" });
      }

      return res.status(200).json({
        success: true,
        document: result[0],
      });
    } catch (err) {
      console.error("Erreur récupération document:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Erreur serveur",
      });
    }
  }

  // PATCH — mise à jour des métadonnées (catégorie, notes)
  if (req.method === "PATCH") {
    try {
      const { category, notes } = req.body;

      const updates = [];
      const values = {};

      if (category !== undefined) {
        const VALID_CATEGORIES = [
          "compromis",
          "acte_definitif",
          "titre_foncier",
          "diagnostic",
          "plan",
          "devis",
          "facture",
          "photo",
          "bancaire",
          "autre",
        ];
        if (!VALID_CATEGORIES.includes(category)) {
          return res.status(400).json({ success: false, error: "Catégorie invalide" });
        }
      }

      // Construction dynamique de la requête UPDATE selon les champs fournis
      if (category !== undefined && notes !== undefined) {
        await sql`
          UPDATE project_documents
          SET category = ${category}, notes = ${notes}
          WHERE id = ${docId}
        `;
      } else if (category !== undefined) {
        await sql`
          UPDATE project_documents
          SET category = ${category}
          WHERE id = ${docId}
        `;
      } else if (notes !== undefined) {
        await sql`
          UPDATE project_documents
          SET notes = ${notes}
          WHERE id = ${docId}
        `;
      } else {
        return res.status(400).json({ success: false, error: "Aucun champ à mettre à jour" });
      }

      const updated = await sql`
        SELECT * FROM project_documents WHERE id = ${docId}
      `;

      return res.status(200).json({
        success: true,
        document: updated[0],
      });
    } catch (err) {
      console.error("Erreur mise à jour document:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Erreur serveur",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Méthode non autorisée" });
}

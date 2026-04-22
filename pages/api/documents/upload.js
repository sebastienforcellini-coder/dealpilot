import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { IncomingForm } from "formidable";
import fs from "fs";

const sql = neon(process.env.DATABASE_URL);

// Désactive le body parser Next.js pour pouvoir parser le FormData nous-mêmes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Formats autorisés
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC ancien
];

// Catégories valides (doit matcher celles de l'UI)
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

// Taille max : 5 Mo
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });
  }

  try {
    // Parse le FormData envoyé par le client
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Validation des champs
    const projectId = Number(fields.project_id?.[0]);
    const category = fields.category?.[0] || "autre";
    const notes = fields.notes?.[0] || null;
    const file = files.file?.[0];

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "project_id manquant ou invalide" });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: "Catégorie invalide" });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: "Aucun fichier reçu" });
    }

    // Vérification du mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Format non supporté. Formats acceptés : PDF, JPG, PNG, HEIC, DOCX`,
      });
    }

    // Vérifier que le projet existe
    const projectExists = await sql`SELECT id FROM projects WHERE id = ${projectId}`;
    if (projectExists.length === 0) {
      return res.status(404).json({ success: false, error: "Projet introuvable" });
    }

    // Lecture du fichier temporaire créé par formidable
    const fileBuffer = fs.readFileSync(file.filepath);

    // Nettoyage du nom de fichier pour éviter les caractères problématiques dans l'URL
    const safeFilename = file.originalFilename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");

    // Génération d'un chemin unique : project-{id}/{timestamp}-{filename}
    const timestamp = Date.now();
    const blobPath = `project-${projectId}/${timestamp}-${safeFilename}`;

    // Upload dans Vercel Blob
    const blob = await put(blobPath, fileBuffer, {
      access: "public",
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Enregistrement en DB
    const result = await sql`
      INSERT INTO project_documents 
        (project_id, category, filename, file_url, file_size, mime_type, notes)
      VALUES 
        (${projectId}, ${category}, ${file.originalFilename}, ${blob.url}, ${file.size}, ${file.mimetype}, ${notes})
      RETURNING *
    `;

    // Nettoyage du fichier temporaire
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Pas grave, le temp sera nettoyé automatiquement
    }

    return res.status(201).json({
      success: true,
      document: result[0],
    });
  } catch (err) {
    console.error("Erreur upload document:", err);

    // Erreur taille fichier trop grand (formidable)
    if (err.code === "LIMIT_FILE_SIZE" || err.message?.includes("maxFileSize")) {
      return res.status(400).json({
        success: false,
        error: "Fichier trop volumineux. Maximum 5 Mo.",
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message || "Erreur serveur lors de l'upload",
    });
  }
}

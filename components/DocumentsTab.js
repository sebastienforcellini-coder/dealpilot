import { useState, useEffect, useRef } from "react";

// Catégories de documents
const CATEGORIES = [
  { id: "compromis", label: "Compromis", icon: "📜" },
  { id: "acte_definitif", label: "Acte définitif", icon: "📋" },
  { id: "titre_foncier", label: "Titre foncier", icon: "🏛️" },
  { id: "diagnostic", label: "Diagnostic", icon: "🔍" },
  { id: "plan", label: "Plan", icon: "📐" },
  { id: "devis", label: "Devis", icon: "💰" },
  { id: "facture", label: "Facture", icon: "🧾" },
  { id: "photo", label: "Photo", icon: "📸" },
  { id: "bancaire", label: "Document bancaire", icon: "🏦" },
  { id: "autre", label: "Autre", icon: "📎" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".heic", ".heif", ".docx", ".doc"];

export default function DocumentsTab({ projectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("autre");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (projectId) fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) setDocuments(data.documents || []);
    } catch (err) {
      console.error("Erreur chargement documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadFile(null);
    setUploadCategory("autre");
    setUploadNotes("");
    setError(null);
    setDragActive(false);
  };

  const validateFile = (file) => {
    if (!file) return "Aucun fichier sélectionné";
    if (file.size > MAX_FILE_SIZE) return `Fichier trop volumineux (max 5 Mo)`;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Format non supporté. Acceptés : PDF, JPG, PNG, HEIC, DOCX`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setUploadFile(null);
      return;
    }
    setError(null);
    setUploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("project_id", projectId);
      formData.append("category", uploadCategory);
      if (uploadNotes) formData.append("notes", uploadNotes);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      // Ajoute le nouveau document en tête de liste
      setDocuments([data.document, ...documents]);
      resetUploadForm();
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err.message || "Erreur serveur");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDocuments(documents.filter((d) => d.id !== id));
        setDeleteId(null);
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getCategoryLabel = (catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? `${cat.icon} ${cat.label}` : catId;
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return "📄";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    return "📄";
  };

  // Filtrage par catégorie
  const filteredDocuments = filter === "all" 
    ? documents 
    : documents.filter((d) => d.category === filter);

  // Comptage par catégorie pour les filtres
  const countByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = documents.filter((d) => d.category === cat.id).length;
    return acc;
  }, {});

  return (
    <div className="documents-tab">
      {/* HEADER */}
      <div className="doc-header">
        <div className="doc-title-wrap">
          <h3 className="doc-title">Documents</h3>
          <p className="doc-subtitle">
            {documents.length === 0 
              ? "Aucun document" 
              : `${documents.length} document${documents.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="btn-add-doc" onClick={() => setShowUpload(true)}>
          <span>+</span> Ajouter un document
        </button>
      </div>

      {/* FILTRES PAR CATÉGORIE */}
      {documents.length > 0 && (
        <div className="doc-filters">
          <button
            className={`doc-chip ${filter === "all" ? "doc-chip-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tous ({documents.length})
          </button>
          {CATEGORIES.filter((c) => countByCategory[c.id] > 0).map((cat) => (
            <button
              key={cat.id}
              className={`doc-chip ${filter === cat.id ? "doc-chip-active" : ""}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.icon} {cat.label} ({countByCategory[cat.id]})
            </button>
          ))}
        </div>
      )}

      {/* CONTENU */}
      {loading ? (
        <div className="doc-loading">Chargement des documents…</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="doc-empty">
          <div className="doc-empty-icon">📁</div>
          <h4>
            {documents.length === 0 
              ? "Aucun document pour l'instant" 
              : "Aucun document dans cette catégorie"}
          </h4>
          <p>
            {documents.length === 0 
              ? "Compromis, diagnostics, factures, plans… Centralisez tous vos documents ici."
              : "Essayez une autre catégorie ou ajoutez un nouveau document."}
          </p>
          {documents.length === 0 && (
            <button className="btn-add-doc" onClick={() => setShowUpload(true)}>
              <span>+</span> Ajouter mon premier document
            </button>
          )}
        </div>
      ) : (
        <div className="doc-grid">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-head">
                <span className="doc-icon">{getFileIcon(doc.mime_type)}</span>
                <span className="doc-category-badge">{getCategoryLabel(doc.category)}</span>
              </div>
              <h4 className="doc-filename" title={doc.filename}>{doc.filename}</h4>
              <div className="doc-meta">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>{formatDate(doc.uploaded_at)}</span>
              </div>
              {doc.notes && <p className="doc-notes">{doc.notes}</p>}
              <div className="doc-actions">
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="doc-btn doc-btn-view"
                  title="Voir / Télécharger"
                >
                  👁 Voir
                </a>
                <button 
                  className="doc-btn doc-btn-delete"
                  onClick={() => setDeleteId(doc.id)}
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE UPLOAD */}
      {showUpload && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} 
          onClick={(e) => { 
            if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") {
              if (!uploading) resetUploadForm();
            } 
            e.currentTarget.dataset.downOnOverlay = ""; 
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Ajouter un document</h2>
              <button 
                className="close-btn" 
                onClick={resetUploadForm}
                disabled={uploading}
              >×</button>
            </div>
            <div className="modal-form">
              {/* Zone drag-and-drop */}
              <div
                className={`drop-zone ${dragActive ? "drop-zone-active" : ""} ${uploadFile ? "drop-zone-has-file" : ""}`}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.docx,.doc"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                {uploadFile ? (
                  <div className="drop-file-preview">
                    <div className="drop-file-icon">{getFileIcon(uploadFile.type)}</div>
                    <div className="drop-file-info">
                      <strong>{uploadFile.name}</strong>
                      <span>{formatFileSize(uploadFile.size)}</span>
                    </div>
                    <button 
                      type="button" 
                      className="drop-file-remove" 
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                    >✕</button>
                  </div>
                ) : (
                  <div className="drop-placeholder">
                    <div className="drop-icon">📤</div>
                    <p><strong>Glissez un fichier ici</strong></p>
                    <p className="drop-sub">ou cliquez pour parcourir</p>
                    <p className="drop-formats">PDF, JPG, PNG, HEIC, DOCX (max 5 Mo)</p>
                  </div>
                )}
              </div>

              {/* Catégorie */}
              <label>
                <span>Catégorie</span>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={uploading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Notes */}
              <label>
                <span>Notes (optionnel)</span>
                <textarea
                  rows="2"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Précision sur ce document…"
                  disabled={uploading}
                />
              </label>

              {/* Erreur */}
              {error && <div className="doc-error">⚠️ {error}</div>}

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-ghost" 
                  onClick={resetUploadForm}
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? "Upload en cours…" : "Uploader"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {deleteId && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} 
          onClick={(e) => { 
            if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setDeleteId(null);
            e.currentTarget.dataset.downOnOverlay = ""; 
          }}
        >
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Supprimer ce document ?</h2>
              <button className="close-btn" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body-text">
              <p>Cette action est <strong>irréversible</strong>.</p>
              <p>Le fichier sera définitivement supprimé de Vercel Blob et de la base de données.</p>
            </div>
            <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
              <button type="button" className="btn-ghost" onClick={() => setDeleteId(null)}>
                Annuler
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => handleDelete(deleteId)}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        .documents-tab {
          width: 100%;
        }

        /* HEADER */
        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .doc-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0B1320;
          margin: 0;
        }

        .doc-subtitle {
          color: #687085;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .btn-add-doc {
          background: #D4AF37;
          color: #0B1320;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
          cursor: pointer;
        }

        .btn-add-doc:hover {
          background: #E6C14E;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
        }

        .btn-add-doc span:first-child {
          font-size: 1.2rem;
          line-height: 1;
        }

        /* FILTRES */
        .doc-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #EEF0F4;
        }

        .doc-chip {
          background: #FFFFFF;
          border: 1px solid #E6E9EF;
          color: #687085;
          padding: 0.5rem 0.9rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .doc-chip:hover {
          border-color: #D4AF37;
          color: #0B1320;
        }

        .doc-chip-active {
          background: #D4AF37;
          border-color: #D4AF37;
          color: #0B1320;
          font-weight: 600;
        }

        /* EMPTY / LOADING */
        .doc-loading {
          text-align: center;
          color: #687085;
          padding: 3rem;
        }

        .doc-empty {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 16px;
          padding: 3.5rem 2rem;
          text-align: center;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }

        .doc-empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .doc-empty h4 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #0B1320;
          margin-bottom: 0.5rem;
        }

        .doc-empty p {
          color: #687085;
          margin-bottom: 1.5rem;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
        }

        /* GRILLE DE DOCUMENTS */
        .doc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .doc-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.15s;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .doc-card:hover {
          border-color: #D4AF37;
          box-shadow: 0 4px 12px rgba(11, 19, 32, 0.06);
          transform: translateY(-1px);
        }

        .doc-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .doc-icon {
          font-size: 1.75rem;
        }

        .doc-category-badge {
          background: rgba(212, 175, 55, 0.12);
          color: #9a7f2a;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .doc-filename {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0B1320;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          min-height: 2.5em;
        }

        .doc-meta {
          display: flex;
          gap: 0.4rem;
          color: #687085;
          font-size: 0.8rem;
        }

        .doc-notes {
          color: #687085;
          font-size: 0.82rem;
          font-style: italic;
          margin: 0.25rem 0 0;
          line-height: 1.4;
        }

        .doc-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #F0F2F5;
        }

        .doc-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid #E6E9EF;
          background: #FFFFFF;
          color: #0B1320;
          text-align: center;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
        }

        .doc-btn-view {
          background: rgba(212, 175, 55, 0.08);
          border-color: rgba(212, 175, 55, 0.3);
          color: #9a7f2a;
        }

        .doc-btn-view:hover {
          background: #D4AF37;
          color: #0B1320;
          border-color: #D4AF37;
        }

        .doc-btn-delete {
          flex: 0 0 auto;
          width: 40px;
          color: #DC2626;
        }

        .doc-btn-delete:hover {
          background: #FEF2F2;
          border-color: #DC2626;
        }

        /* DROP ZONE */
        .drop-zone {
          border: 2px dashed #E6E9EF;
          border-radius: 12px;
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #FAFBFC;
        }

        .drop-zone:hover {
          border-color: #D4AF37;
          background: rgba(212, 175, 55, 0.04);
        }

        .drop-zone-active {
          border-color: #D4AF37;
          background: rgba(212, 175, 55, 0.08);
          border-style: solid;
        }

        .drop-zone-has-file {
          border-color: #D4AF37;
          border-style: solid;
          background: #FFFFFF;
          padding: 1rem;
        }

        .drop-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .drop-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .drop-placeholder p {
          margin: 0;
          color: #0B1320;
          font-size: 0.9rem;
        }

        .drop-sub {
          color: #687085 !important;
          font-size: 0.85rem !important;
        }

        .drop-formats {
          color: #9a7f2a !important;
          font-size: 0.75rem !important;
          margin-top: 0.5rem !important;
        }

        .drop-file-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
        }

        .drop-file-icon {
          font-size: 2rem;
          flex: 0 0 auto;
        }

        .drop-file-info {
          flex: 1;
          text-align: left;
          min-width: 0;
        }

        .drop-file-info strong {
          display: block;
          color: #0B1320;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .drop-file-info span {
          color: #687085;
          font-size: 0.8rem;
        }

        .drop-file-remove {
          background: #F0F2F5;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: #687085;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }

        .drop-file-remove:hover {
          background: #FEF2F2;
          color: #DC2626;
        }

        .doc-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        /* MODAL (reprend les styles existants du projet) */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11, 19, 32, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }

        .modal {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(11, 19, 32, 0.3);
        }

        .modal-small {
          max-width: 440px;
        }

        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid #EEF0F4;
        }

        .modal-head h2 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #0B1320;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #687085;
          font-size: 1.75rem;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .close-btn:hover:not(:disabled) {
          color: #0B1320;
        }

        .close-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .modal-form {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modal-form label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .modal-form label span {
          color: #0B1320;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .modal-form select,
        .modal-form textarea {
          background: #FFFFFF;
          border: 1px solid #E6E9EF;
          color: #0B1320;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
          font-family: inherit;
          resize: vertical;
        }

        .modal-form select:focus,
        .modal-form textarea:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
        }

        .modal-form select:disabled,
        .modal-form textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .modal-body-text {
          padding: 1.25rem 1.75rem;
          color: #687085;
          font-size: 0.95rem;
          line-height: 1.55;
        }

        .modal-body-text p {
          margin-bottom: 0.5rem;
        }

        .modal-body-text strong {
          color: #DC2626;
        }

        /* Boutons génériques */
        .btn-primary {
          background: #D4AF37;
          color: #0B1320;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .btn-primary:hover:not(:disabled) {
          background: #E6C14E;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-ghost {
          background: transparent;
          color: #687085;
          border: 1px solid #E6E9EF;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .btn-ghost:hover:not(:disabled) {
          background: #F0F2F5;
          color: #0B1320;
        }

        .btn-ghost:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #DC2626;
          color: #FFFFFF;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .btn-danger:hover {
          background: #B91C1C;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .doc-header {
            flex-direction: column;
            align-items: stretch;
          }
          .doc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

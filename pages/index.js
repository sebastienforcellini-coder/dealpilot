import { useState, useEffect } from "react";
import Head from "next/head";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotifs, setShowNotifs] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    budget: "",
    currency: "EUR",
    propertyType: "",
    description: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({
          name: "",
          country: "",
          city: "",
          budget: "",
          currency: "EUR",
          propertyType: "",
          description: "",
        });
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: "overview", label: "Aperçu" },
    { id: "budget", label: "Budget & Coûts" },
    { id: "timeline", label: "Chronologie" },
    { id: "documents", label: "Documents" },
    { id: "more", label: "Plus" },
  ];

  return (
    <>
      <Head>
        <title>DealPilot — Chaque étape. Maîtrise totale.</title>
        <meta name="description" content="La plateforme tout-en-un qui pilote chaque étape de votre acquisition immobilière." />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="app">
        {/* HEADER SOMBRE */}
        <header className="header">
          <div className="header-inner">
            <div className="brand">
              <img src="/logo-horizontal.png" alt="DealPilot" className="logo" />
            </div>
            <div className="header-actions">
              <div className="notif-wrapper">
                <button
                  className="icon-btn"
                  aria-label="Notifications"
                  onClick={() => setShowNotifs(!showNotifs)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </button>
                {showNotifs && (
                  <>
                    <div className="notif-backdrop" onClick={() => setShowNotifs(false)} />
                    <div className="notif-dropdown">
                      <div className="notif-head">
                        <h3>Notifications</h3>
                      </div>
                      <div className="notif-empty">
                        <div className="notif-empty-icon">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                          </svg>
                        </div>
                        <p className="notif-empty-title">Aucune notification pour le moment</p>
                        <p className="notif-empty-sub">
                          Vous serez notifié ici des échéances à venir, mises à jour de documents et étapes clés de vos projets.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="avatar">S</div>
            </div>
          </div>
        </header>

        {/* MAIN - FOND CLAIR */}
        <main className="main">
          {/* Page head */}
          <div className="page-head">
            <div>
              <h1 className="page-title">Tableau de bord</h1>
              <p className="page-subtitle">Chaque étape. Maîtrise totale.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <span className="btn-plus">+</span> Nouveau projet
            </button>
          </div>

          {/* Tabs */}
          <nav className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <section className="content">
            {activeTab === "overview" && (
              <>
                {loading ? (
                  <div className="loading">Chargement...</div>
                ) : projects.length === 0 ? (
                  <div className="empty-card">
                    <div className="empty-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <h3>Commencez votre premier projet</h3>
                    <p>Créez un nouveau projet immobilier pour commencer à suivre vos investissements en toute confiance.</p>
                    <button className="btn-outline" onClick={() => setShowForm(true)}>
                      Créer un projet
                    </button>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {projects.map((p, i) => (
                      <div key={i} className="project-card">
                        <div className="project-header">
                          <h3>{p.name}</h3>
                          <span className="tag">{p.property_type || "Bien"}</span>
                        </div>
                        <p className="project-location">
                          {p.city}{p.city && p.country && ", "}{p.country}
                        </p>
                        <div className="project-budget">
                          <span className="label">Budget</span>
                          <span className="amount">
                            {p.currency === "EUR" ? "€" : p.currency === "USD" ? "$" : p.currency + " "}
                            {Number(p.budget || 0).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        {p.description && <p className="project-desc">{p.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab !== "overview" && (
              <div className="empty-card">
                <h3>Bientôt disponible</h3>
                <p>Cette section est en cours de construction.</p>
              </div>
            )}
          </section>

          {/* Pillars */}
          <section className="pillars">
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h4>Tout-en-un</h4>
              <p>Tout au même endroit</p>
            </div>
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2 L12 12 L22 12" />
                </svg>
              </div>
              <h4>Transparence</h4>
              <p>Des détails clairs, sans surprise</p>
            </div>
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15.5 14" />
                </svg>
              </div>
              <h4>Gain de temps</h4>
              <p>Suivi automatisé et rappels</p>
            </div>
            <div className="pillar">
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4>Sérénité</h4>
              <p>Sécurisé, fiable et confidentiel</p>
            </div>
          </section>
        </main>

        {/* MODAL NEW PROJECT */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Nouveau projet</h2>
                <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <label>
                  <span>Nom du projet *</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex. Villa Marrakech"
                  />
                </label>
                <div className="row">
                  <label>
                    <span>Pays</span>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Maroc"
                    />
                  </label>
                  <label>
                    <span>Ville</span>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Marrakech"
                    />
                  </label>
                </div>
                <div className="row">
                  <label>
                    <span>Budget</span>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="425000"
                    />
                  </label>
                  <label>
                    <span>Devise</span>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="MAD">MAD</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>Type de bien</span>
                  <input
                    type="text"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    placeholder="Villa, Appartement, Riad..."
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Courte description..."
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Créer le projet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="footer">
          <p>DealPilot — Chaque étape. Maîtrise totale. Sérénité complète.</p>
        </footer>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          font-family: "Poppins", -apple-system, BlinkMacSystemFont, sans-serif;
          background: #F7F8FA;
          color: #0B1320;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        button {
          font-family: inherit;
          cursor: pointer;
        }

        input, select, textarea {
          font-family: inherit;
        }
      `}</style>

      <style jsx>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #F7F8FA;
        }

        /* HEADER - SOMBRE */
        .header {
          background: #0B1320;
          padding: 1.1rem 0;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 0 rgba(212, 175, 55, 0.15);
        }

        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand .logo {
          height: 42px;
          width: auto;
          display: block;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          background: transparent;
          border: 1px solid rgba(230, 233, 239, 0.15);
          color: #E6E9EF;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          border-color: #D4AF37;
          color: #D4AF37;
        }

        /* NOTIFICATIONS DROPDOWN */
        .notif-wrapper {
          position: relative;
        }

        .notif-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 340px;
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(11, 19, 32, 0.18);
          z-index: 30;
          overflow: hidden;
          animation: notif-fade 0.15s ease-out;
        }

        @keyframes notif-fade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notif-head {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #EEF0F4;
        }

        .notif-head h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0B1320;
        }

        .notif-empty {
          padding: 2rem 1.5rem;
          text-align: center;
        }

        .notif-empty-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
        }

        .notif-empty-title {
          color: #0B1320;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.4rem;
        }

        .notif-empty-sub {
          color: #687085;
          font-size: 0.82rem;
          line-height: 1.5;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #b8942e);
          color: #0B1320;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
        }

        /* MAIN - FOND CLAIR */
        .main {
          flex: 1;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 2.5rem 2rem;
        }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 2.25rem;
          font-weight: 600;
          color: #0B1320;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: #687085;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.35rem;
          font-weight: 500;
        }

        .btn-primary {
          background: #D4AF37;
          color: #0B1320;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
        }

        .btn-primary:hover {
          background: #E6C14E;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
        }

        .btn-plus {
          font-size: 1.2rem;
          line-height: 1;
        }

        .btn-outline {
          background: transparent;
          color: #0B1320;
          border: 1.5px solid #D4AF37;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: #D4AF37;
          color: #0B1320;
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
        }

        .btn-ghost:hover {
          background: #F0F2F5;
          color: #0B1320;
        }

        /* TABS */
        .tabs {
          display: flex;
          gap: 0.25rem;
          background: #FFFFFF;
          padding: 0.35rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
          border: 1px solid #EEF0F4;
        }

        .tab {
          flex: 1;
          padding: 0.75rem 1rem;
          background: transparent;
          color: #687085;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          min-width: max-content;
        }

        .tab:hover {
          color: #0B1320;
        }

        .tab-active {
          background: #D4AF37;
          color: #0B1320;
          font-weight: 600;
        }

        /* CONTENT */
        .content {
          margin-bottom: 3rem;
        }

        .loading {
          text-align: center;
          color: #687085;
          padding: 3rem;
        }

        .empty-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 16px;
          padding: 3.5rem 2rem;
          text-align: center;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }

        .empty-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 1.5rem;
          background: rgba(212, 175, 55, 0.12);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
        }

        .empty-card h3 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #0B1320;
          margin-bottom: 0.5rem;
        }

        .empty-card p {
          color: #687085;
          margin-bottom: 1.75rem;
          max-width: 420px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .project-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }

        .project-card:hover {
          border-color: #D4AF37;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11, 19, 32, 0.08);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          gap: 0.75rem;
        }

        .project-card h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #0B1320;
        }

        .tag {
          background: rgba(212, 175, 55, 0.12);
          color: #9a7f2a;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .project-location {
          color: #687085;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .project-budget {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-top: 1rem;
          border-top: 1px solid #EEF0F4;
        }

        .project-budget .label {
          color: #687085;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .project-budget .amount {
          color: #0B1320;
          font-weight: 600;
          font-size: 1.15rem;
        }

        .project-desc {
          color: #687085;
          font-size: 0.875rem;
          margin-top: 0.75rem;
          line-height: 1.5;
        }

        /* PILLARS */
        .pillars {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          padding: 2.5rem 0 1rem;
          border-top: 1px solid #EEF0F4;
        }

        .pillar {
          text-align: left;
          padding: 0.25rem 0;
        }

        .pillar-icon {
          color: #D4AF37;
          margin-bottom: 0.75rem;
          display: inline-flex;
        }

        .pillar h4 {
          color: #0B1320;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pillar p {
          color: #687085;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* MODAL */
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
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #0B1320;
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

        .modal-form input,
        .modal-form select,
        .modal-form textarea {
          background: #FFFFFF;
          border: 1px solid #E6E9EF;
          color: #0B1320;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
          resize: vertical;
        }

        .modal-form input:focus,
        .modal-form select:focus,
        .modal-form textarea:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
        }

        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        /* FOOTER */
        .footer {
          border-top: 1px solid #EEF0F4;
          padding: 1.5rem 2rem;
          text-align: center;
          background: #FFFFFF;
        }

        .footer p {
          color: #687085;
          font-size: 0.8rem;
          letter-spacing: 0.03em;
        }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .main {
            padding: 1.5rem 1rem;
          }
          .page-title {
            font-size: 1.75rem;
          }
          .brand .logo {
            height: 32px;
          }
          .row {
            grid-template-columns: 1fr;
          }
          .tabs {
            flex-wrap: nowrap;
          }
          .header-inner {
            padding: 0 1rem;
          }
        }
      `}</style>
    </>
  );
}

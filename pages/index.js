import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AppHeader from "../components/AppHeader";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = création, sinon = id du projet édité
  const [menuOpenId, setMenuOpenId] = useState(null); // id du projet dont le menu ⋯ est ouvert
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // id du projet à confirmer

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    city: "",
    budget: "",
    currency: "MAD",
    propertyType: "",
    description: "",
  });

  // Taux de change vers EUR (stocké au chargement)
  const [rates, setRates] = useState({ MAD: 0.093, USD: 0.92, GBP: 1.17, EUR: 1 });

  useEffect(() => {
    fetchProjects();
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      // API gratuite sans clé — taux de change par rapport à EUR
      const res = await fetch("https://open.er-api.com/v6/latest/EUR");
      const data = await res.json();
      if (data && data.rates) {
        // On inverse pour avoir taux → EUR
        setRates({
          EUR: 1,
          MAD: 1 / data.rates.MAD,
          USD: 1 / data.rates.USD,
          GBP: 1 / data.rates.GBP,
        });
      }
    } catch (err) {
      console.error("Erreur taux de change, utilisation de valeurs par défaut", err);
    }
  };

  const toEUR = (amount, currency) => {
    if (!amount) return 0;
    const rate = rates[currency] || 1;
    return Math.round(Number(amount) * rate);
  };

  const currencySymbol = (c) => {
    if (c === "EUR") return "€";
    if (c === "USD") return "$";
    if (c === "GBP") return "£";
    return c;
  };

  const formatAmount = (amount, currency) => {
    const n = Number(amount || 0).toLocaleString("fr-FR");
    if (currency === "EUR") return `${n} €`;
    if (currency === "USD") return `$${n}`;
    if (currency === "GBP") return `£${n}`;
    return `${n} ${currency}`;
  };

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

  const resetForm = () => {
    setFormData({
      name: "",
      country: "",
      city: "",
      budget: "",
      currency: "MAD",
      propertyType: "",
      description: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (project) => {
    setFormData({
      name: project.name || "",
      country: project.country || "",
      city: project.city || "",
      budget: project.target_budget || project.budget || "",
      currency: project.currency || "MAD",
      propertyType: project.property_type || "",
      description: project.description || "",
    });
    setEditingId(project.id);
    setShowForm(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: formData.name,
        country: formData.country,
        city: formData.city,
        property_type: formData.propertyType,
        description: formData.description,
        currency: formData.currency,
        target_budget: formData.budget ? Number(formData.budget) : null,
      };

      const res = await fetch(
        editingId ? `/api/projects/${editingId}` : "/api/projects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingId
              ? body
              : {
                  name: formData.name,
                  country: formData.country,
                  city: formData.city,
                  propertyType: formData.propertyType,
                  description: formData.description,
                  currency: formData.currency,
                  targetBudget: formData.budget ? Number(formData.budget) : null,
                }
          ),
        }
      );
      const data = await res.json();
      if (data.success) {
        resetForm();
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteId(null);
        setMenuOpenId(null);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        {/* HEADER PARTAGÉ */}
        <AppHeader />

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

          {/* Content */}
          <section className="content">
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
                  <div
                    key={i}
                    className="project-card"
                    onClick={(e) => {
                      // Ne pas naviguer si on clique sur le menu ou ses enfants
                      if (e.target.closest(".card-menu")) return;
                      router.push(`/projet/${p.id}`);
                    }}
                  >
                    <div className="card-menu">
                      <button
                        className="menu-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === p.id ? null : p.id);
                        }}
                        aria-label="Options"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                      {menuOpenId === p.id && (
                        <>
                          <div
                            className="menu-backdrop"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                            }}
                          />
                          <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="menu-item"
                              onClick={() => openEditForm(p)}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              className="menu-item menu-item-danger"
                              onClick={() => {
                                setConfirmDeleteId(p.id);
                                setMenuOpenId(null);
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="project-header">
                      <h3>{p.name}</h3>
                      <span className="tag">{p.property_type || "Bien"}</span>
                    </div>
                    <p className="project-location">
                      {p.city}{p.city && p.country && ", "}{p.country}
                    </p>
                    <div className="project-budget">
                      <div className="budget-row">
                        <span className="label">Budget</span>
                        <span className="amount">{formatAmount(p.target_budget || p.budget, p.currency)}</span>
                      </div>
                      {p.currency !== "EUR" && (p.target_budget || p.budget) && (
                        <div className="budget-row budget-eur">
                          <span className="label-eur">≈</span>
                          <span className="amount-eur">{Number(toEUR(p.target_budget || p.budget, p.currency)).toLocaleString("fr-FR")} €</span>
                        </div>
                      )}
                    </div>
                    {p.description && <p className="project-desc">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>

        {/* MODAL NEW/EDIT PROJECT */}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>{editingId ? "Modifier le projet" : "Nouveau projet"}</h2>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <label>
                  <span>Nom du projet *</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex. Riad Marrakech"
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
                      placeholder="4250000"
                    />
                  </label>
                  <label>
                    <span>Devise locale</span>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="MAD">MAD — Dirham marocain</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — Dollar US</option>
                      <option value="GBP">GBP — Livre sterling</option>
                    </select>
                  </label>
                </div>
                {formData.budget && formData.currency !== "EUR" && (
                  <div className="conversion-hint">
                    ≈ {Number(toEUR(formData.budget, formData.currency)).toLocaleString("fr-FR")} €
                  </div>
                )}
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
                  <button type="button" className="btn-ghost" onClick={resetForm}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingId ? "Enregistrer" : "Créer le projet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION SUPPRESSION */}
        {confirmDeleteId && (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Supprimer le projet ?</h2>
                <button className="close-btn" onClick={() => setConfirmDeleteId(null)}>×</button>
              </div>
              <div className="modal-body-text">
                <p>Cette action est <strong>irréversible</strong>.</p>
                <p>Tous les contacts, coûts, postes travaux, documents et étapes de chronologie liés à ce projet seront également supprimés définitivement.</p>
              </div>
              <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => deleteProject(confirmDeleteId)}
                >
                  Supprimer définitivement
                </button>
              </div>
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

        .btn-danger {
          background: #DC2626;
          color: #FFFFFF;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #B91C1C;
        }

        .modal-small {
          max-width: 440px;
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
          cursor: pointer;
          position: relative;
        }

        /* MENU CARD */
        .card-menu {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 2;
        }

        .menu-trigger {
          background: transparent;
          border: none;
          color: #687085;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          cursor: pointer;
        }

        .menu-trigger:hover {
          background: #F0F2F5;
          color: #0B1320;
        }

        .menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
        }

        .menu-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(11, 19, 32, 0.12);
          z-index: 50;
          min-width: 160px;
          overflow: hidden;
        }

        .menu-item {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          color: #0B1320;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .menu-item:hover {
          background: #F7F8FA;
        }

        .menu-item-danger {
          color: #DC2626;
        }

        .menu-item-danger:hover {
          background: #FEF2F2;
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
          margin-right: 2.2rem;
        }

        .project-location {
          color: #687085;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .project-budget {
          padding-top: 1rem;
          border-top: 1px solid #EEF0F4;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .budget-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
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

        .budget-eur {
          opacity: 0.7;
        }

        .label-eur {
          color: #687085;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .amount-eur {
          color: #687085;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .conversion-hint {
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.25);
          color: #9a7f2a;
          padding: 0.65rem 0.9rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: center;
        }

        .project-desc {
          color: #687085;
          font-size: 0.875rem;
          margin-top: 0.75rem;
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
          .header-inner {
            padding: 0 1rem;
          }
        }
      `}</style>
    </>
  );
}
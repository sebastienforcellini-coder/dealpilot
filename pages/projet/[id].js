import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("apercu");
  const [showNotifs, setShowNotifs] = useState(false);
  const [rates, setRates] = useState({ MAD: 0.093, USD: 0.92, GBP: 1.17, EUR: 1 });

  useEffect(() => {
    if (!id) return;
    fetchProject();
    fetchRates();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/EUR");
      const d = await res.json();
      if (d && d.rates) {
        setRates({
          EUR: 1,
          MAD: 1 / d.rates.MAD,
          USD: 1 / d.rates.USD,
          GBP: 1 / d.rates.GBP,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toEUR = (amount, currency) => {
    if (!amount) return 0;
    const rate = rates[currency] || 1;
    return Math.round(Number(amount) * rate);
  };

  const formatAmount = (amount, currency) => {
    const n = Number(amount || 0).toLocaleString("fr-FR");
    if (currency === "EUR") return `${n} €`;
    if (currency === "USD") return `$${n}`;
    if (currency === "GBP") return `£${n}`;
    return `${n} ${currency}`;
  };

  const statusLabels = {
    prospection: "Prospection",
    negociation: "Négociation",
    compromis: "Compromis signé",
    acte: "Acte authentique",
    travaux: "Travaux en cours",
    livre: "Livré",
  };

  const tabs = [
    { id: "apercu", label: "Aperçu" },
    { id: "budget", label: "Budget & Coûts" },
    { id: "contacts", label: "Contacts" },
    { id: "chronologie", label: "Chronologie" },
    { id: "documents", label: "Documents" },
  ];

  if (loading) {
    return (
      <div className="loading-page">
        <p>Chargement…</p>
        <style jsx>{`
          .loading-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #687085; font-family: "Poppins", sans-serif; }
        `}</style>
      </div>
    );
  }

  if (!data || !data.project) {
    return (
      <div className="error-page">
        <p>Projet introuvable.</p>
        <Link href="/">← Retour au tableau de bord</Link>
        <style jsx>{`
          .error-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #687085; font-family: "Poppins", sans-serif; }
          a { color: #D4AF37; text-decoration: none; font-weight: 500; }
        `}</style>
      </div>
    );
  }

  const { project, contacts, costs, works, timeline, interactions } = data;
  const totalCosts = costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalWorksEstimated = works.reduce((sum, w) => sum + Number(w.estimated_amount || 0), 0);
  const totalWorksActual = works.reduce((sum, w) => sum + Number(w.actual_amount || 0), 0);
  const grandTotal = totalCosts + totalWorksEstimated;

  return (
    <>
      <Head>
        <title>{project.name} — DealPilot</title>
        <link rel="icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="brand">
              <img src="/logo-horizontal.png" alt="DealPilot" className="logo" />
            </Link>
            <div className="header-actions">
              <div className="notif-wrapper">
                <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </button>
                {showNotifs && (
                  <>
                    <div className="notif-backdrop" onClick={() => setShowNotifs(false)} />
                    <div className="notif-dropdown">
                      <div className="notif-head"><h3>Notifications</h3></div>
                      <div className="notif-empty">
                        <p className="notif-empty-title">Aucune notification pour le moment</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="avatar">S</div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="main">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link href="/">Tableau de bord</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>

          {/* Page head */}
          <div className="page-head">
            <div>
              <div className="project-meta">
                <span className={`status-badge status-${project.status}`}>
                  {statusLabels[project.status] || project.status}
                </span>
                {project.property_type && <span className="meta-item">{project.property_type}</span>}
                {project.city && <span className="meta-item">{project.city}{project.country ? `, ${project.country}` : ""}</span>}
              </div>
              <h1 className="page-title">{project.name}</h1>
              {project.description && <p className="page-subtitle">{project.description}</p>}
            </div>
            <div className="total-box">
              <span className="total-label">Budget total estimé</span>
              <span className="total-amount">{formatAmount(grandTotal, project.currency)}</span>
              {project.currency !== "EUR" && (
                <span className="total-eur">≈ {Number(toEUR(grandTotal, project.currency)).toLocaleString("fr-FR")} €</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <section className="content">
            {activeTab === "apercu" && (
              <div className="cards-grid">
                <div className="info-card">
                  <h3>Informations générales</h3>
                  <dl className="info-list">
                    {project.address && (<><dt>Adresse</dt><dd>{project.address}</dd></>)}
                    <dt>Type de bien</dt><dd>{project.property_type || "—"}</dd>
                    <dt>Pays</dt><dd>{project.country || "—"}</dd>
                    <dt>Ville</dt><dd>{project.city || "—"}</dd>
                    <dt>Devise locale</dt><dd>{project.currency}</dd>
                    <dt>Statut</dt><dd>{statusLabels[project.status] || project.status}</dd>
                  </dl>
                </div>

                <div className="info-card">
                  <h3>Répartition financière</h3>
                  <div className="summary-row">
                    <span>Prix & frais d'achat</span>
                    <span className="summary-amount">{formatAmount(totalCosts, project.currency)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Travaux estimés</span>
                    <span className="summary-amount">{formatAmount(totalWorksEstimated, project.currency)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Travaux réalisés</span>
                    <span className="summary-amount">{formatAmount(totalWorksActual, project.currency)}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row summary-total">
                    <span>Total estimé</span>
                    <span className="summary-amount">{formatAmount(grandTotal, project.currency)}</span>
                  </div>
                  {project.currency !== "EUR" && (
                    <div className="summary-row summary-eur">
                      <span>Équivalent</span>
                      <span>≈ {Number(toEUR(grandTotal, project.currency)).toLocaleString("fr-FR")} €</span>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h3>Équipe projet</h3>
                  {contacts.length === 0 ? (
                    <p className="empty-mini">Aucun contact ajouté.</p>
                  ) : (
                    <ul className="contacts-mini">
                      {contacts.slice(0, 5).map((c) => (
                        <li key={c.id}>
                          <span className="contact-type">{c.type}</span>
                          <span className="contact-name">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="info-card">
                  <h3>Prochaines étapes</h3>
                  {timeline.filter((e) => e.status !== "termine").length === 0 ? (
                    <p className="empty-mini">Aucune étape à venir.</p>
                  ) : (
                    <ul className="timeline-mini">
                      {timeline.filter((e) => e.status !== "termine").slice(0, 4).map((e) => (
                        <li key={e.id}>
                          <span className="event-date">
                            {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                          <span>{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {activeTab === "budget" && (
              <div className="placeholder-card">
                <h3>Budget & Coûts</h3>
                <p>Détail complet des coûts d'acquisition et des postes travaux.</p>
                <p className="coming-soon">⏳ Interface d'édition en cours de construction (étape 2)</p>
                <div className="quick-summary">
                  <div className="quick-row"><span>Coûts d'achat ({costs.length} lignes)</span><strong>{formatAmount(totalCosts, project.currency)}</strong></div>
                  <div className="quick-row"><span>Travaux estimés ({works.length} postes)</span><strong>{formatAmount(totalWorksEstimated, project.currency)}</strong></div>
                </div>
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="placeholder-card">
                <h3>Contacts du projet</h3>
                <p>Notaire, agent immobilier, architecte, banque, courtier, entreprises…</p>
                <p className="coming-soon">⏳ CRM complet avec historique des échanges (étape 3)</p>
                <div className="quick-summary">
                  <div className="quick-row"><span>Nombre de contacts</span><strong>{contacts.length}</strong></div>
                  <div className="quick-row"><span>Interactions enregistrées</span><strong>{interactions.length}</strong></div>
                </div>
              </div>
            )}

            {activeTab === "chronologie" && (
              <div className="placeholder-card">
                <h3>Chronologie du projet</h3>
                <p>Étapes clés : visites, offre, compromis, acte, travaux, livraison.</p>
                <p className="coming-soon">⏳ Timeline interactive (étape 4)</p>
                <div className="quick-summary">
                  <div className="quick-row"><span>Étapes totales</span><strong>{timeline.length}</strong></div>
                  <div className="quick-row"><span>Terminées</span><strong>{timeline.filter(e => e.status === "termine").length}</strong></div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="placeholder-card">
                <h3>Documents</h3>
                <p>Compromis, diagnostics, devis, factures, plans…</p>
                <p className="coming-soon">⏳ Upload et stockage sécurisé (étape 4)</p>
              </div>
            )}
          </section>
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: "Poppins", -apple-system, BlinkMacSystemFont, sans-serif;
          background: #F7F8FA;
          color: #0B1320;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        button { font-family: inherit; cursor: pointer; }
        a { color: inherit; }
      `}</style>

      <style jsx>{`
        .app { min-height: 100vh; display: flex; flex-direction: column; background: #F7F8FA; }

        /* HEADER */
        .header {
          background: #0B1320;
          padding: 1.1rem 0;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 0 rgba(212, 175, 55, 0.15);
        }
        .header-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 2rem;
          display: flex; justify-content: space-between; align-items: center;
        }
        .brand { display: block; text-decoration: none; }
.brand .logo { height: 36px; width: auto; max-width: 180px; display: block; object-fit: contain; }        .header-actions { display: flex; align-items: center; gap: 1rem; }
        .icon-btn {
          background: transparent; border: 1px solid rgba(230, 233, 239, 0.15);
          color: #E6E9EF; width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          position: relative; transition: all 0.2s;
        }
        .icon-btn:hover { border-color: #D4AF37; color: #D4AF37; }
        .notif-wrapper { position: relative; }
        .notif-backdrop { position: fixed; inset: 0; z-index: 20; }
        .notif-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; background: #FFFFFF; border: 1px solid #EEF0F4;
          border-radius: 14px; box-shadow: 0 12px 40px rgba(11, 19, 32, 0.18);
          z-index: 30; overflow: hidden;
        }
        .notif-head { padding: 1rem 1.25rem; border-bottom: 1px solid #EEF0F4; }
        .notif-head h3 { font-size: 0.95rem; font-weight: 600; color: #0B1320; }
        .notif-empty { padding: 2rem 1.5rem; text-align: center; }
        .notif-empty-title { color: #687085; font-size: 0.9rem; }
        .avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #b8942e);
          color: #0B1320; display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 1rem;
        }

        /* MAIN */
        .main { flex: 1; max-width: 1280px; margin: 0 auto; width: 100%; padding: 2.5rem 2rem; }

        .breadcrumb {
          display: flex; align-items: center; gap: 0.5rem;
          color: #687085; font-size: 0.85rem; margin-bottom: 1.5rem;
        }
        .breadcrumb a { color: #687085; text-decoration: none; transition: color 0.2s; }
        .breadcrumb a:hover { color: #D4AF37; }

        .page-head {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 2rem; flex-wrap: wrap; gap: 1.5rem;
        }
        .project-meta {
          display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.65rem;
        }
        .status-badge {
          padding: 0.25rem 0.75rem; border-radius: 6px;
          font-size: 0.75rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
          background: rgba(212, 175, 55, 0.15); color: #9a7f2a;
        }
        .status-termine, .status-livre { background: rgba(34, 197, 94, 0.12); color: #15803d; }
        .status-travaux { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
        .meta-item {
          padding: 0.25rem 0.75rem; border-radius: 6px;
          font-size: 0.75rem; font-weight: 500;
          background: #F0F2F5; color: #687085;
        }
        .page-title {
          font-size: 2.25rem; font-weight: 600; color: #0B1320;
          letter-spacing: -0.02em; margin-bottom: 0.4rem;
        }
        .page-subtitle { color: #687085; font-size: 0.95rem; max-width: 600px; line-height: 1.5; }

        .total-box {
          background: #FFFFFF; border: 1px solid #EEF0F4; border-radius: 14px;
          padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.2rem;
          min-width: 240px; box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }
        .total-label { color: #687085; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
        .total-amount { color: #0B1320; font-size: 1.4rem; font-weight: 600; }
        .total-eur { color: #9a7f2a; font-size: 0.9rem; font-weight: 500; }

        /* TABS */
        .tabs {
          display: flex; gap: 0.25rem;
          background: #FFFFFF; padding: 0.35rem;
          border-radius: 12px; margin-bottom: 2rem;
          overflow-x: auto; border: 1px solid #EEF0F4;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }
        .tab {
          flex: 1; padding: 0.75rem 1rem; background: transparent;
          color: #687085; border: none; border-radius: 8px;
          font-size: 0.9rem; font-weight: 500; transition: all 0.2s;
          white-space: nowrap; min-width: max-content;
        }
        .tab:hover { color: #0B1320; }
        .tab-active { background: #D4AF37; color: #0B1320; font-weight: 600; }

        /* CONTENT */
        .content { margin-bottom: 3rem; }

        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .info-card {
          background: #FFFFFF; border: 1px solid #EEF0F4; border-radius: 14px;
          padding: 1.5rem; box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }
        .info-card h3 {
          font-size: 0.85rem; font-weight: 700; color: #0B1320;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 1rem; padding-bottom: 0.75rem;
          border-bottom: 1px solid #EEF0F4;
        }

        .info-list {
          display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; font-size: 0.9rem;
        }
        .info-list dt { color: #687085; font-weight: 500; }
        .info-list dd { color: #0B1320; text-align: right; }

        .summary-row {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 0.5rem 0; font-size: 0.9rem; color: #687085;
        }
        .summary-amount { color: #0B1320; font-weight: 500; }
        .summary-total { font-size: 1rem; font-weight: 600; color: #0B1320; }
        .summary-total .summary-amount { font-size: 1.1rem; font-weight: 600; }
        .summary-divider { border-top: 1px solid #EEF0F4; margin: 0.5rem 0; }
        .summary-eur { color: #9a7f2a; font-size: 0.85rem; font-weight: 500; }

        .contacts-mini, .timeline-mini {
          list-style: none; display: flex; flex-direction: column; gap: 0.6rem;
        }
        .contacts-mini li, .timeline-mini li {
          display: flex; gap: 0.75rem; align-items: center;
          font-size: 0.9rem; padding: 0.3rem 0;
        }
        .contact-type {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          color: #9a7f2a; background: rgba(212, 175, 55, 0.1);
          padding: 0.2rem 0.5rem; border-radius: 5px;
          min-width: 80px; text-align: center;
        }
        .contact-name { color: #0B1320; }
        .event-date {
          font-weight: 600; color: #D4AF37; min-width: 70px; font-size: 0.85rem;
        }
        .timeline-mini li span:last-child { color: #0B1320; }
        .empty-mini { color: #687085; font-size: 0.9rem; font-style: italic; }

        .placeholder-card {
          background: #FFFFFF; border: 1px solid #EEF0F4; border-radius: 14px;
          padding: 2.5rem 2rem; text-align: center;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.04);
        }
        .placeholder-card h3 { font-size: 1.2rem; font-weight: 600; color: #0B1320; margin-bottom: 0.5rem; }
        .placeholder-card p { color: #687085; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .coming-soon { color: #9a7f2a; font-weight: 500; margin-top: 1rem; }
        .quick-summary {
          max-width: 420px; margin: 2rem auto 0; display: flex; flex-direction: column; gap: 0.5rem;
        }
        .quick-row {
          display: flex; justify-content: space-between; padding: 0.75rem 1rem;
          background: #F7F8FA; border-radius: 8px; font-size: 0.9rem;
        }
        .quick-row strong { color: #0B1320; font-weight: 600; }
        .quick-row span { color: #687085; }

        @media (max-width: 640px) {
          .main { padding: 1.5rem 1rem; }
          .page-title { font-size: 1.75rem; }
          .brand .logo { height: 32px; }
          .page-head { flex-direction: column; }
          .total-box { width: 100%; }
          .header-inner { padding: 0 1rem; }
        }
      `}</style>
    </>
  );
}

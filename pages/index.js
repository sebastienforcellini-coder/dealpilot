import { useState, useEffect } from "react";
import Head from "next/head";

export default function DealPilot() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#0A1526",
        color: "white",
        fontFamily: "Arial"
      }}>
        <div>🚀 Chargement DealPilot + Neon...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>DealPilot - Gestion Immobilière</title>
      </Head>
      
      <div style={{ 
        minHeight: "100vh", 
        background: "#0A1526", 
        color: "#FFFFFF",
        padding: "2rem",
        fontFamily: "Arial"
      }}>
        <header style={{ 
          textAlign: "center",
          marginBottom: "3rem"
        }}>
          <h1 style={{ 
            fontSize: "3rem", 
            color: "#D4AF37",
            margin: "0 0 1rem 0"
          }}>
            🏠 DealPilot
          </h1>
          <p style={{ color: "#B0B8C8", fontSize: "1.2rem" }}>
            Plateforme de Gestion Immobilière avec Neon Database
          </p>
        </header>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: "#1A2332",
            border: "1px solid #2A3441",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center"
          }}>
            <h2 style={{ color: "#D4AF37", marginBottom: "1rem" }}>
              ✅ Next.js + Neon Integration Active !
            </h2>
            
            <div style={{ marginBottom: "2rem" }}>
              <p>🎯 <strong>API Neon :</strong> <code>/api/projects</code></p>
              <p>🚀 <strong>Framework :</strong> Next.js 14</p>
              <p>💾 <strong>Database :</strong> Neon PostgreSQL</p>
              <p>📊 <strong>Projets trouvés :</strong> {projects.length}</p>
            </div>

            <div style={{ 
              display: "grid", 
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              marginBottom: "2rem"
            }}>
              <a 
                href="/api/projects"
                style={{
                  background: "#D4AF37",
                  color: "#081320",
                  padding: "1rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                🔗 Tester API
              </a>
              
              <div style={{
                background: "#2A3441",
                color: "#B0B8C8",
                padding: "1rem",
                borderRadius: "8px"
              }}>
                📈 Dashboard (Soon)
              </div>
            </div>

            {projects.length > 0 && (
              <div>
                <h3 style={{ color: "#FFFFFF", marginBottom: "1rem" }}>
                  Projets dans Neon :
                </h3>
                {projects.map((project, index) => (
                  <div key={index} style={{
                    background: "#2A3441",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                    textAlign: "left"
                  }}>
                    <strong>{project.name}</strong> - {project.city}, {project.country}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

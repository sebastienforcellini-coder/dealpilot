import { useState } from "react";
import Link from "next/link";

export default function AppHeader() {
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="dp-header">
      <div className="dp-header-inner">
        <Link href="/" className="dp-brand">
          <img src="/logo-horizontal.png" alt="DealPilot" className="dp-logo" />
        </Link>

        <div className="dp-header-actions">
          {/* Notifications */}
          <div className="dp-notif-wrapper">
            <button
              className="dp-icon-btn"
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
                <div className="dp-notif-backdrop" onClick={() => setShowNotifs(false)} />
                <div className="dp-notif-dropdown">
                  <div className="dp-notif-head">
                    <h3>Notifications</h3>
                  </div>
                  <div className="dp-notif-empty">
                    <div className="dp-notif-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    </div>
                    <p className="dp-notif-empty-title">Aucune notification pour le moment</p>
                    <p className="dp-notif-empty-hint">
                      Vous serez alerté ici des échéances importantes.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar (placeholder) */}
          <div className="dp-avatar" aria-label="Profil">S</div>
        </div>
      </div>

      <style jsx>{`
        .dp-header {
          background: #0B1320;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 0 rgba(212, 175, 55, 0.15);
        }
        .dp-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dp-brand {
          display: block;
          text-decoration: none;
          line-height: 0;
        }
        .dp-logo {
          height: 36px !important;
          width: auto !important;
          max-width: 180px !important;
          display: block;
          object-fit: contain;
        }
        .dp-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dp-icon-btn {
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
          cursor: pointer;
        }
        .dp-icon-btn:hover {
          border-color: #D4AF37;
          color: #D4AF37;
        }
        .dp-avatar {
          width: 40px;
          height: 40px;
          background: #D4AF37;
          color: #0B1320;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        /* Notifications dropdown */
        .dp-notif-wrapper {
          position: relative;
        }
        .dp-notif-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
        }
        .dp-notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(11, 19, 32, 0.18);
          z-index: 30;
          overflow: hidden;
        }
        .dp-notif-head {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #F3F4F6;
        }
        .dp-notif-head h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0B1320;
          margin: 0;
        }
        .dp-notif-empty {
          padding: 2rem 1.25rem;
          text-align: center;
        }
        .dp-notif-empty-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 0.85rem;
          background: #F7F8FA;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #687085;
        }
        .dp-notif-empty-title {
          font-weight: 500;
          color: #0B1320;
          margin: 0 0 0.25rem 0;
        }
        .dp-notif-empty-hint {
          font-size: 0.85rem;
          color: #687085;
          margin: 0;
        }

        @media (max-width: 640px) {
          .dp-header-inner {
            padding: 0.75rem 1rem;
          }
          .dp-logo {
            height: 32px !important;
            max-width: 140px !important;
          }
        }
      `}</style>
    </header>
  );
}
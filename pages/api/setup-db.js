import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export default async function handler(req, res) {
  try {
    const results = [];

    // 1. Table projects (mise à jour avec nouveaux champs)
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        property_type VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'prospection',
        currency VARCHAR(10) DEFAULT 'MAD',
        target_budget DECIMAL(14,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table projects");

    // Ajouter les colonnes manquantes si la table existait déjà (en cas de mise à jour)
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'prospection'`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_budget DECIMAL(14,2)`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    // Champs statut foncier (principalement Maroc)
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS land_status VARCHAR(50)`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS melkia_reference TEXT`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS requisition_number TEXT`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS requisition_date DATE`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS title_number TEXT`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS title_date DATE`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS conservation_office TEXT`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS land_notes TEXT`;
    results.push("✅ Colonnes projects à jour");

    // 2. Table contacts (CARNET D'ADRESSES GLOBAL, indépendant des projets)
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table contacts");

    // Migration : on rend project_id optionnel (carnet global)
    // + ajout des colonnes complémentaires sur le contact lui-même
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS iban TEXT`;
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT`;
    // Anciennes colonnes commission qui restaient sur contacts (on migre vers project_contacts)
    // On les garde pour compatibilité mais elles ne sont plus utilisées
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2)`;
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(14,2)`;
    // Rendre project_id nullable (les contacts du carnet global n'ont pas forcément un projet fixe)
    try {
      await sql`ALTER TABLE contacts ALTER COLUMN project_id DROP NOT NULL`;
    } catch (e) {
      // déjà nullable
    }
    results.push("✅ Colonnes contacts à jour");

    // 2bis. Table project_contacts (LIAISON projet ↔ contact avec données spécifiques au projet)
    await sql`
      CREATE TABLE IF NOT EXISTS project_contacts (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        project_role VARCHAR(255),
        commission_percentage DECIMAL(5,2),
        commission_amount DECIMAL(14,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, contact_id)
      )
    `;
    results.push("✅ Table project_contacts (liaison)");

    // Migration : pour les contacts existants qui ont déjà un project_id,
    // on crée automatiquement la liaison dans project_contacts (si pas déjà faite)
    await sql`
      INSERT INTO project_contacts (project_id, contact_id, commission_percentage, commission_amount)
      SELECT
        c.project_id,
        c.id,
        c.commission_percentage,
        c.commission_amount
      FROM contacts c
      WHERE c.project_id IS NOT NULL
      ON CONFLICT (project_id, contact_id) DO NOTHING
    `;
    results.push("✅ Migration contacts → project_contacts");

    // 3. Table contact_interactions (historique des échanges)
    await sql`
      CREATE TABLE IF NOT EXISTS contact_interactions (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(50),
        subject VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table contact_interactions");

    // 4. Table costs (prix achat, notaire, agent, taxes, mobilier...)
    await sql`
      CREATE TABLE IF NOT EXISTS costs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        amount DECIMAL(14,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'MAD',
        percentage DECIMAL(5,2),
        paid BOOLEAN DEFAULT FALSE,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table costs");

    // Migration : ajouter les colonnes manquantes (status, contact_id, type_key, base_amount, tax_rate, fixed_fee, due_date)
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'estime'`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS type_key VARCHAR(50)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS input_mode VARCHAR(20) DEFAULT 'amount'`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS base_amount DECIMAL(14,2)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS fixed_fee DECIMAL(14,2)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS due_date DATE`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS compromise_date DATE`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
    // Split officiel / cash (spécifique immo Maroc : prix déclaré + cash + frais cash)
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS amount_official DECIMAL(14,2)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS amount_cash DECIMAL(14,2)`;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS amount_cash_fees DECIMAL(14,2)`;
    // Base de référence pour les pourcentages (official = 800k, real = 1180k)
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS base_reference VARCHAR(20) DEFAULT 'official'`;
    // Marque si la ligne représente du cash (pour affichage)
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS is_cash BOOLEAN DEFAULT FALSE`;
    results.push("✅ Colonnes costs à jour");

    // 5. Table works (postes travaux : plomberie, électricité, cuisine...)
    await sql`
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        label VARCHAR(255) NOT NULL,
        estimated_amount DECIMAL(14,2) DEFAULT 0,
        actual_amount DECIMAL(14,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'MAD',
        status VARCHAR(50) DEFAULT 'a_faire',
        contractor_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        start_date DATE,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table works");

    // 6. Table timeline_events (étapes du projet)
    await sql`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        event_date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'prevu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("✅ Table timeline_events");

    // 7. Données d'exemple : Riad Marrakech (uniquement si aucun projet n'existe)
    const existingProjects = await sql`SELECT COUNT(*) as count FROM projects`;
    if (existingProjects[0].count === "0" || existingProjects[0].count === 0) {
      const [newProject] = await sql`
        INSERT INTO projects (name, country, city, address, property_type, description, status, currency, target_budget)
        VALUES (
          'Riad Marrakech',
          'Maroc',
          'Marrakech',
          'Médina, quartier Kasbah',
          'Riad',
          'Riad traditionnel de 4 chambres avec patio et piscine, à rénover entièrement.',
          'negociation',
          'MAD',
          4250000
        )
        RETURNING id
      `;
      const pid = newProject.id;

      // Contacts d'exemple
      const [notaire] = await sql`
        INSERT INTO contacts (project_id, type, name, company, role, email, phone)
        VALUES (${pid}, 'notaire', 'Maître Ahmed Benali', 'Étude Benali', 'Notaire', 'benali@notaire.ma', '+212 524 43 21 65')
        RETURNING id
      `;
      const [agent] = await sql`
        INSERT INTO contacts (project_id, type, name, company, role, email, phone)
        VALUES (${pid}, 'agent', 'Sophie Martin', 'Marrakech Real Estate', 'Agent immobilier', 'sophie@mre.ma', '+212 661 23 45 67')
        RETURNING id
      `;
      await sql`
        INSERT INTO contacts (project_id, type, name, company, role, phone)
        VALUES (${pid}, 'architecte', 'Karim Alaoui', 'Studio Alaoui Architecture', 'Architecte', '+212 662 11 22 33')
      `;
      await sql`
        INSERT INTO contacts (project_id, type, name, company, role, phone)
        VALUES (${pid}, 'banque', 'Jean Dupont', 'BMCE Bank', 'Conseiller crédit', '+212 522 44 55 66')
      `;
      await sql`
        INSERT INTO contacts (project_id, type, name, company, role, phone)
        VALUES (${pid}, 'courtier', 'Amine Tazi', 'Cafpi Maroc', 'Courtier en prêts', '+212 661 77 88 99')
      `;

      // Coûts d'exemple
      await sql`INSERT INTO costs (project_id, category, label, amount, currency) VALUES (${pid}, 'achat', 'Prix d''achat du bien', 4250000, 'MAD')`;
      await sql`INSERT INTO costs (project_id, category, label, amount, currency, percentage) VALUES (${pid}, 'notaire', 'Frais de notaire', 212500, 'MAD', 5.00)`;
      await sql`INSERT INTO costs (project_id, category, label, amount, currency, percentage) VALUES (${pid}, 'agent', 'Commission agent immobilier', 127500, 'MAD', 3.00)`;
      await sql`INSERT INTO costs (project_id, category, label, amount, currency, percentage) VALUES (${pid}, 'taxes', 'Droits d''enregistrement', 170000, 'MAD', 4.00)`;
      await sql`INSERT INTO costs (project_id, category, label, amount, currency) VALUES (${pid}, 'diagnostics', 'Diagnostics et expertises', 15000, 'MAD')`;
      await sql`INSERT INTO costs (project_id, category, label, amount, currency) VALUES (${pid}, 'mobilier', 'Mobilier et décoration', 350000, 'MAD')`;

      // Postes travaux d'exemple
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'plomberie', 'Plomberie — refonte complète', 180000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'electricite', 'Électricité — mise aux normes', 150000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'cuisine', 'Cuisine équipée sur mesure', 220000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'salle_de_bain', 'Salles de bain (4 unités)', 280000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'peinture', 'Peinture et enduits traditionnels', 95000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'sols', 'Sols — zellige et tadelakt', 140000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'menuiserie', 'Menuiserie bois traditionnelle', 180000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'piscine', 'Rénovation piscine patio', 75000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'climatisation', 'Climatisation réversible', 120000, 'MAD')`;
      await sql`INSERT INTO works (project_id, category, label, estimated_amount, currency) VALUES (${pid}, 'toiture', 'Toiture et terrasse', 85000, 'MAD')`;

      // Chronologie
      await sql`INSERT INTO timeline_events (project_id, event_date, title, description, status) VALUES (${pid}, '2026-03-15', 'Première visite du bien', 'Visite avec l''agent immobilier Sophie Martin', 'termine')`;
      await sql`INSERT INTO timeline_events (project_id, event_date, title, description, status) VALUES (${pid}, '2026-04-02', 'Offre d''achat', 'Offre à 4 250 000 MAD acceptée', 'termine')`;
      await sql`INSERT INTO timeline_events (project_id, event_date, title, description, status) VALUES (${pid}, '2026-05-10', 'Compromis de vente', 'Signature du compromis chez le notaire', 'prevu')`;
      await sql`INSERT INTO timeline_events (project_id, event_date, title, description, status) VALUES (${pid}, '2026-07-15', 'Acte authentique', 'Signature de l''acte définitif', 'prevu')`;
      await sql`INSERT INTO timeline_events (project_id, event_date, title, description, status) VALUES (${pid}, '2026-08-01', 'Début des travaux', 'Lancement de la rénovation', 'prevu')`;

      // Interactions d'exemple
      await sql`INSERT INTO contact_interactions (contact_id, type, subject, notes) VALUES (${agent.id}, 'visite', 'Première visite du riad', 'Visite des 4 chambres, patio et piscine. Point sur les travaux nécessaires.')`;
      await sql`INSERT INTO contact_interactions (contact_id, type, subject, notes) VALUES (${notaire.id}, 'rendez-vous', 'Ouverture du dossier', 'Préparation du compromis de vente.')`;

      results.push("✅ Données d'exemple insérées (Riad Marrakech)");
    } else {
      results.push("ℹ️ Projets existants détectés — pas d'insertion d'exemple");
    }

    res.json({
      success: true,
      message: "Base de données initialisée avec succès",
      results,
    });
  } catch (error) {
    console.error("Setup DB Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
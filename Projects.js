// pages/api/projects.js - API Next.js pour ton repo existant
import { neon } from '@neondatabase/serverless';

// Ta connection string Neon exacte (remplace par la vraie avec password)
const sql = neon(process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:PASSWORD_ICI@ep-ancient-butterfly-alzvrkn.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

// Initialisation des tables (auto-création au premier appel)
async function initTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        budget DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        property_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        description TEXT,
        expense_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
    `;
    console.log('✅ Tables Neon initialisées');
  } catch (error) {
    console.error('❌ Erreur init tables:', error);
  }
}

export default async function handler(req, res) {
  // Initialiser les tables au premier appel
  await initTables();

  // CORS headers pour ton domaine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userEmail = 'sebastien@dealpilot.com'; // Ton email par défaut

    switch (req.method) {
      case 'GET':
        // Récupérer les projets
        const user = await getOrCreateUser(userEmail);
        const projects = await sql`
          SELECT p.*, 
                 COALESCE(SUM(e.amount), 0) as total_spent
          FROM projects p
          LEFT JOIN expenses e ON p.id = e.project_id  
          WHERE p.user_id = ${user.id}
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `;

        res.status(200).json({ 
          success: true, 
          projects: projects.map(p => ({
            ...p,
            budget: parseFloat(p.budget),
            totalExpenses: parseFloat(p.total_spent),
            percentageUsed: parseFloat(p.budget) > 0 ? (parseFloat(p.total_spent) / parseFloat(p.budget)) * 100 : 0
          }))
        });
        break;

      case 'POST':
        // Créer un projet
        const { name, country, city, budget, currency, propertyType, description } = req.body;

        if (!name || !country || !city || !budget || !currency || !propertyType) {
          return res.status(400).json({ 
            success: false, 
            error: 'Champs requis manquants' 
          });
        }

        const user2 = await getOrCreateUser(userEmail);
        const newProject = await sql`
          INSERT INTO projects (user_id, name, country, city, budget, currency, property_type, description)
          VALUES (${user2.id}, ${name}, ${country}, ${city}, ${budget}, ${currency}, ${propertyType}, ${description || ''})
          RETURNING *
        `;

        res.status(201).json({ 
          success: true, 
          project: newProject[0] 
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

// Fonction helper pour créer/récupérer utilisateur
async function getOrCreateUser(email) {
  let user = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  
  if (user.length === 0) {
    const newUser = await sql`
      INSERT INTO users (email, name) 
      VALUES (${email}, ${email.split('@')[0]}) 
      RETURNING *
    `;
    return newUser[0];
  }
  
  return user[0];
}

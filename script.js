// Configuration des villes par pays
const citiesByCountry = {
    maroc: ["Marrakech", "Casablanca", "Rabat", "Fès", "Tanger", "Agadir"],
    france: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Bordeaux"],
    usa: ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas"],
    espagne: ["Madrid", "Barcelone", "Séville", "Valence", "Bilbao", "Malaga"],
    portugal: ["Lisbonne", "Porto", "Faro", "Coimbra", "Braga", "Aveiro"]
};

// Taux de change approximatifs (EUR comme base)
const exchangeRates = {
    EUR: 1,
    MAD: 10.5,
    USD: 1.1
};

// Stockage local pour les projets
let projects = JSON.parse(localStorage.getItem('dealpilot_projects')) || [];
let currentProjectId = localStorage.getItem('dealpilot_current_project') || null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProjects();
});

function initializeApp() {
    console.log('DealPilot initialized');
    
    // Vérifier que le bouton existe
    const nouveauProjetBtn = document.getElementById('nouveau-projet-btn');
    if (nouveauProjetBtn) {
        console.log('Bouton Nouveau Projet trouvé');
    } else {
        console.error('Bouton Nouveau Projet non trouvé');
    }
}

function setupEventListeners() {
    // Gestion des onglets de navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Bouton Nouveau Projet
    const nouveauProjetBtn = document.getElementById('nouveau-projet-btn');
    if (nouveauProjetBtn) {
        nouveauProjetBtn.addEventListener('click', openProjectModal);
    }

    // Gestionnaire du formulaire de projet
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }

    // Fermer modal en cliquant à l'extérieur
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProjectModal();
            }
        });
    }

    // Échapper pour fermer la modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
        }
    });
}

function switchTab(tabName) {
    // Désactiver tous les onglets
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => tab.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));

    // Activer l'onglet sélectionné
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedPanel = document.getElementById(tabName);

    if (selectedTab && selectedPanel) {
        selectedTab.classList.add('active');
        selectedPanel.classList.add('active');
    }
}

function openProjectModal() {
    console.log('Ouverture de la modal projet');
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('show');
        // Focus sur le premier champ
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('show');
        // Réinitialiser le formulaire
        const form = document.getElementById('project-form');
        if (form) {
            form.reset();
            updateCities(); // Réinitialiser les villes
        }
    }
}

function updateCities() {
    const countrySelect = document.getElementById('project-country');
    const citySelect = document.getElementById('project-city');
    const currencySelect = document.getElementById('project-currency');
    
    if (!countrySelect || !citySelect) return;
    
    const selectedCountry = countrySelect.value;
    
    // Vider les villes actuelles
    citySelect.innerHTML = '<option value="">Sélectionner une ville</option>';
    
    if (selectedCountry && citiesByCountry[selectedCountry]) {
        const cities = citiesByCountry[selectedCountry];
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.toLowerCase();
            option.textContent = city;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
        
        // Ajuster la devise par défaut selon le pays
        if (currencySelect) {
            switch(selectedCountry) {
                case 'maroc':
                    currencySelect.value = 'MAD';
                    break;
                case 'usa':
                    currencySelect.value = 'USD';
                    break;
                default:
                    currencySelect.value = 'EUR';
            }
        }
    } else {
        citySelect.innerHTML = '<option value="">Choisir d\'abord un pays</option>';
        citySelect.disabled = true;
    }
}

function handleProjectSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const projectData = {
        id: Date.now().toString(),
        name: document.getElementById('project-name').value,
        country: document.getElementById('project-country').value,
        city: document.getElementById('project-city').value,
        budget: parseFloat(document.getElementById('project-budget').value),
        currency: document.getElementById('project-currency').value,
        type: document.getElementById('project-type').value,
        notes: document.getElementById('project-notes').value,
        createdAt: new Date().toISOString(),
        expenses: [],
        documents: []
    };

    // Validation
    if (!projectData.name || !projectData.country || !projectData.city || !projectData.budget) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Ajouter le projet
    addProject(projectData);
    
    // Fermer la modal
    closeProjectModal();
    
    // Afficher un message de succès
    showNotification('Projet créé avec succès !', 'success');
}

function addProject(projectData) {
    projects.push(projectData);
    localStorage.setItem('dealpilot_projects', JSON.stringify(projects));
    
    // Définir comme projet courant
    currentProjectId = projectData.id;
    localStorage.setItem('dealpilot_current_project', currentProjectId);
    
    // Recharger l'affichage
    loadProjects();
}

function loadProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    if (projects.length === 0) {
        // Afficher l'état vide
        projectsGrid.innerHTML = `
            <div class="project-card empty-state">
                <div class="empty-icon">🏠</div>
                <h3>Commencez votre premier projet</h3>
                <p>Créez un nouveau projet immobilier pour commencer à suivre vos investissements.</p>
                <button class="secondary-button" onclick="openProjectModal()">Créer un projet</button>
            </div>
        `;
    } else {
        // Afficher les projets
        projectsGrid.innerHTML = projects.map(project => createProjectCard(project)).join('');
    }
    
    // Mettre à jour les statistiques budgétaires
    updateBudgetOverview();
}

function createProjectCard(project) {
    const formatCurrency = (amount, currency) => {
        const symbols = { EUR: '€', MAD: 'د.م.', USD: '$' };
        return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
    };

    const totalExpenses = project.expenses ? 
        project.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
    const remainingBudget = project.budget - totalExpenses;
    const progressPercent = (totalExpenses / project.budget) * 100;

    return `
        <div class="project-card" onclick="selectProject('${project.id}')">
            <div class="project-header">
                <h3>${project.name}</h3>
                <span class="project-location">${project.city}, ${project.country}</span>
            </div>
            <div class="project-details">
                <div class="project-budget">
                    <span class="budget-label">Budget total</span>
                    <span class="budget-amount">${formatCurrency(project.budget, project.currency)}</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progressPercent, 100)}%"></div>
                    </div>
                    <span class="progress-text">${progressPercent.toFixed(1)}% utilisé</span>
                </div>
                <div class="project-type">
                    <span class="type-badge">${project.type}</span>
                </div>
            </div>
        </div>
    `;
}

function selectProject(projectId) {
    currentProjectId = projectId;
    localStorage.setItem('dealpilot_current_project', currentProjectId);
    
    // Mettre à jour l'affichage
    loadProjects();
    
    // Optionnel : passer à l'onglet Budget pour voir les détails
    switchTab('budget');
    
    showNotification('Projet sélectionné', 'info');
}

function updateBudgetOverview() {
    const currentProject = projects.find(p => p.id === currentProjectId);
    
    if (!currentProject) {
        // Pas de projet sélectionné, afficher des totaux globaux
        const totalBudget = projects.reduce((sum, project) => {
            // Convertir en EUR pour le total
            const rate = exchangeRates[project.currency] || 1;
            return sum + (project.budget / rate);
        }, 0);
        
        document.querySelector('.budget-amount').textContent = `${Math.round(totalBudget).toLocaleString()} €`;
        return;
    }
    
    // Projet spécifique sélectionné
    const totalExpenses = currentProject.expenses ? 
        currentProject.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
    const remainingBudget = currentProject.budget - totalExpenses;
    const progressPercent = (totalExpenses / currentProject.budget) * 100;
    
    const symbols = { EUR: '€', MAD: 'د.م.', USD: '$' };
    const currencySymbol = symbols[currentProject.currency] || currentProject.currency;
    
    const budgetCard = document.querySelector('.budget-card');
    if (budgetCard) {
        budgetCard.innerHTML = `
            <h3>Budget - ${currentProject.name}</h3>
            <div class="budget-amount">${currentProject.budget.toLocaleString()} ${currencySymbol}</div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(progressPercent, 100)}%"></div>
                </div>
                <span class="progress-text">${progressPercent.toFixed(1)}% utilisé</span>
            </div>
            <div class="budget-breakdown">
                <div class="budget-item">
                    <span>Dépensé</span>
                    <span>${totalExpenses.toLocaleString()} ${currencySymbol}</span>
                </div>
                <div class="budget-item">
                    <span>Restant</span>
                    <span>${remainingBudget.toLocaleString()} ${currencySymbol}</span>
                </div>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    // Créer une notification simple
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles inline pour la notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
        color: 'white',
        borderRadius: '8px',
        zIndex: '10000',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Suppression après 3 secondes
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Fonctions globales pour l'HTML
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.updateCities = updateCities;
window.selectProject = selectProject;

// Export pour modules (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openProjectModal,
        closeProjectModal,
        updateCities,
        selectProject
    };
}

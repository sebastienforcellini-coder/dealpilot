import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import DocumentsTab from "../../components/DocumentsTab";

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("apercu");
  const [showNotifs, setShowNotifs] = useState(false);
  const [rates, setRates] = useState({ MAD: 0.093, USD: 0.92, GBP: 1.17, EUR: 1 });
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    country: "",
    city: "",
    address: "",
    property_type: "",
    description: "",
    status: "prospection",
    currency: "MAD",
    target_budget: "",
    // Statut foncier (Maroc principalement)
    land_status: "",
    melkia_reference: "",
    requisition_number: "",
    requisition_date: "",
    title_number: "",
    title_date: "",
    conservation_office: "",
    land_notes: "",
  });

  // --- CONTACTS ---
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormMode, setContactFormMode] = useState("new"); // "new" (créer) ou "pick" (choisir existant)
  const [editingContactId, setEditingContactId] = useState(null); // édite les données du carnet
  const [editingAssociationId, setEditingAssociationId] = useState(null); // édite l'association projet (commission)
  const [contactUnlinkId, setContactUnlinkId] = useState(null); // délier du projet
  const [contactDeleteId, setContactDeleteId] = useState(null); // supprimer du carnet
  const [contactMenuOpenId, setContactMenuOpenId] = useState(null);
  const [availableContacts, setAvailableContacts] = useState([]); // carnet filtré (pas encore associés)
  const [pickContactId, setPickContactId] = useState(""); // contact choisi dans le carnet

  const [contactData, setContactData] = useState({
    type: "agent",
    name: "",
    company: "",
    role: "",
    email: "",
    phone: "",
    address: "",
    iban: "",
    website: "",
    notes: "",
    // Champs projet (commission pour CE projet)
    commission_mode: "percentage",
    commission_percentage: "",
    commission_amount: "",
    project_role: "",
    project_notes: "",
  });

  // --- COSTS ---
  const [showCostForm, setShowCostForm] = useState(false);
  const [editingCostId, setEditingCostId] = useState(null);
  const [costDeleteId, setCostDeleteId] = useState(null);
  const [costMenuOpenId, setCostMenuOpenId] = useState(null);
  const [costCatalogOpen, setCostCatalogOpen] = useState(false);
  const [costData, setCostData] = useState({
    type_key: "",
    category: "acquisition",
    label: "",
    input_mode: "amount", // "amount" | "percentage" | "complex" | "split"
    amount: "",
    percentage: "",
    base_amount: "",
    tax_rate: "",
    fixed_fee: "",
    contact_id: "",
    status: "estime",
    due_date: "",
    compromise_date: "",
    notes: "",
    // Split prix d'achat (Maroc)
    amount_official: "",
    amount_cash: "",
    amount_cash_fees: "",
    // Base de référence pour les %
    base_reference: "official", // "official" (800k) ou "real" (1,180M)
    is_cash: false,
  });

  // --- INTERACTIONS ---
  const [showInteractionForm, setShowInteractionForm] = useState(null);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [interactionData, setInteractionData] = useState({
    type: "appel",
    subject: "",
    notes: "",
    interaction_date: new Date().toISOString().substring(0, 10),
  });

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

  const openEdit = () => {
    if (!data || !data.project) return;
    const p = data.project;
    setEditData({
      name: p.name || "",
      country: p.country || "",
      city: p.city || "",
      address: p.address || "",
      property_type: p.property_type || "",
      description: p.description || "",
      status: p.status || "prospection",
      currency: p.currency || "MAD",
      target_budget: p.target_budget || "",
      land_status: p.land_status || "",
      melkia_reference: p.melkia_reference || "",
      requisition_number: p.requisition_number || "",
      requisition_date: p.requisition_date ? p.requisition_date.substring(0, 10) : "",
      title_number: p.title_number || "",
      title_date: p.title_date ? p.title_date.substring(0, 10) : "",
      conservation_office: p.conservation_office || "",
      land_notes: p.land_notes || "",
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          country: editData.country,
          city: editData.city,
          address: editData.address,
          property_type: editData.property_type,
          description: editData.description,
          status: editData.status,
          currency: editData.currency,
          target_budget: editData.target_budget ? Number(editData.target_budget) : null,
          land_status: editData.land_status,
          melkia_reference: editData.melkia_reference,
          requisition_number: editData.requisition_number,
          requisition_date: editData.requisition_date || null,
          title_number: editData.title_number,
          title_date: editData.title_date || null,
          conservation_office: editData.conservation_office,
          land_notes: editData.land_notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEdit(false);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- CONTACTS : reset, open, submit, delete ---
  const resetContactForm = () => {
    setContactData({
      type: "agent",
      name: "",
      company: "",
      role: "",
      email: "",
      phone: "",
      address: "",
      iban: "",
      website: "",
      notes: "",
      commission_mode: "percentage",
      commission_percentage: "",
      commission_amount: "",
      project_role: "",
      project_notes: "",
    });
    setEditingContactId(null);
    setEditingAssociationId(null);
    setShowContactForm(false);
    setContactFormMode("new");
    setPickContactId("");
  };

  // Ouvrir le formulaire en mode "nouveau contact"
  const openNewContactForm = async () => {
    resetContactForm();
    setContactFormMode("new");
    setShowContactForm(true);
    // Charger le carnet global pour permettre de basculer vers "choisir existant"
    await fetchAvailableContacts();
  };

  // Ouvrir le formulaire en mode "choisir existant"
  const openPickContactForm = async () => {
    resetContactForm();
    setContactFormMode("pick");
    setShowContactForm(true);
    await fetchAvailableContacts();
  };

  // Récupérer les contacts du carnet pas encore associés à ce projet
  const fetchAvailableContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?exclude_project=${id}`);
      const json = await res.json();
      if (json.success) setAvailableContacts(json.contacts || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Ouvrir en mode "éditer le contact" (données du carnet global)
  const openEditContact = (contact) => {
    setContactData({
      type: contact.type || "agent",
      name: contact.name || "",
      company: contact.company || "",
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      iban: contact.iban || "",
      website: contact.website || "",
      notes: contact.notes || "",
      // ces champs ne sont pas utilisés en mode édition carnet
      commission_mode: "percentage",
      commission_percentage: "",
      commission_amount: "",
      project_role: "",
      project_notes: "",
    });
    setEditingContactId(contact.id);
    setEditingAssociationId(null);
    setContactFormMode("edit");
    setShowContactForm(true);
    setContactMenuOpenId(null);
  };

  // Ouvrir en mode "éditer l'association" (commission pour CE projet)
  const openEditAssociation = (contact) => {
    setContactData({
      ...contactData,
      type: contact.type,
      name: contact.name,
      commission_mode: contact.commission_amount ? "amount" : "percentage",
      commission_percentage: contact.commission_percentage || "",
      commission_amount: contact.commission_amount || "",
      project_role: contact.project_role || "",
      project_notes: contact.project_notes || "",
    });
    setEditingAssociationId(contact.association_id);
    setEditingContactId(null);
    setContactFormMode("assoc");
    setShowContactForm(true);
    setContactMenuOpenId(null);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mode "edit" : on met à jour seulement le contact du carnet
      if (contactFormMode === "edit" && editingContactId) {
        const res = await fetch(`/api/contacts/${editingContactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: contactData.type,
            name: contactData.name,
            company: contactData.company,
            role: contactData.role,
            email: contactData.email,
            phone: contactData.phone,
            address: contactData.address,
            iban: contactData.iban,
            website: contactData.website,
            notes: contactData.notes,
          }),
        });
        const json = await res.json();
        if (json.success) {
          resetContactForm();
          fetchProject();
        }
        return;
      }

      // Mode "assoc" : on met à jour seulement l'association projet (commission)
      if (contactFormMode === "assoc" && editingAssociationId) {
        const res = await fetch(`/api/project-contacts?association_id=${editingAssociationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_role: contactData.project_role,
            commission_percentage:
              contactData.commission_mode === "percentage" ? contactData.commission_percentage : null,
            commission_amount:
              contactData.commission_mode === "amount" ? contactData.commission_amount : null,
            notes: contactData.project_notes,
          }),
        });
        const json = await res.json();
        if (json.success) {
          resetContactForm();
          fetchProject();
        }
        return;
      }

      // Mode "pick" : associer un contact existant du carnet
      if (contactFormMode === "pick") {
        if (!pickContactId) {
          alert("Sélectionnez un contact dans le carnet");
          return;
        }
        const res = await fetch("/api/project-contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: Number(id),
            contact_id: Number(pickContactId),
            project_role: contactData.project_role,
            commission_percentage:
              contactData.commission_mode === "percentage" ? contactData.commission_percentage : null,
            commission_amount:
              contactData.commission_mode === "amount" ? contactData.commission_amount : null,
            notes: contactData.project_notes,
          }),
        });
        const json = await res.json();
        if (json.success) {
          resetContactForm();
          fetchProject();
        } else {
          alert("Erreur : " + (json.error || "inconnue"));
        }
        return;
      }

      // Mode "new" : créer un nouveau contact ET l'associer au projet
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contactData.type,
          name: contactData.name,
          company: contactData.company,
          role: contactData.role,
          email: contactData.email,
          phone: contactData.phone,
          address: contactData.address,
          iban: contactData.iban,
          website: contactData.website,
          notes: contactData.notes,
          // Liaison automatique avec le projet courant
          project_id: Number(id),
          project_role: contactData.project_role,
          commission_percentage:
            contactData.commission_mode === "percentage" ? contactData.commission_percentage : null,
          commission_amount:
            contactData.commission_mode === "amount" ? contactData.commission_amount : null,
          project_notes: contactData.project_notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        resetContactForm();
        fetchProject();
      } else {
        alert("Erreur : " + (json.error || "inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // Délier un contact du projet (garde dans le carnet)
  const unlinkContact = async (associationId) => {
    try {
      const res = await fetch(`/api/project-contacts?association_id=${associationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setContactUnlinkId(null);
        setContactMenuOpenId(null);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Supprimer définitivement du carnet (+ toutes associations)
  const deleteContact = async (contactId) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setContactDeleteId(null);
        setContactMenuOpenId(null);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- INTERACTIONS : add, delete ---
  const openInteractionForm = (contactId) => {
    setInteractionData({
      type: "appel",
      subject: "",
      notes: "",
      interaction_date: new Date().toISOString().substring(0, 10),
    });
    setShowInteractionForm(contactId);
  };

  const handleInteractionSubmit = async (e, contactId) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: contactId,
          interaction_date: interactionData.interaction_date,
          type: interactionData.type,
          subject: interactionData.subject,
          notes: interactionData.notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowInteractionForm(null);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteInteraction = async (interactionId) => {
    if (!confirm("Supprimer cette interaction ?")) return;
    try {
      await fetch(`/api/interactions?id=${interactionId}`, { method: "DELETE" });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  // ============ CATALOGUE POSTES PRÉ-DÉFINIS (adapté Maroc) ============
  const costCatalog = [
    // Acquisition
    {
      key: "prix_achat",
      category: "acquisition",
      label: "Prix d'achat du bien",
      icon: "🏠",
      description: "Déclaré (virement) + Cash + Frais d'acquisition",
      input_mode: "split", // mode spécial 3 champs
      hint: "Spécifique Maroc : séparation officiel/cash pour le calcul correct des frais",
    },
    {
      key: "honoraires_notaire",
      category: "acquisition",
      label: "Honoraires notaire",
      icon: "⚖️",
      description: "Commission du notaire (1% min) + TVA 20%",
      input_mode: "complex",
      percentage: 1,
      tax_rate: 20,
      fixed_fee: 1500,
      hint: "Au Maroc : 1% du prix déclaré + TVA 20% (minimum 1500 DH)",
      contact_type: "notaire",
      default_base: "official", // se calcule sur le prix déclaré
    },
    {
      key: "droits_enregistrement",
      category: "acquisition",
      label: "Droits d'enregistrement",
      icon: "📋",
      description: "Taxe d'enregistrement obligatoire",
      input_mode: "percentage",
      percentage: 4,
      hint: "4% du prix déclaré (terrain nu : 6%)",
      default_base: "official",
    },
    {
      key: "conservation_fonciere",
      category: "acquisition",
      label: "Conservation foncière",
      icon: "📜",
      description: "Frais d'inscription ANCFCC",
      input_mode: "complex",
      percentage: 1,
      fixed_fee: 150,
      hint: "1% du prix déclaré + 150 DH forfaitaire",
      default_base: "official",
    },
    {
      key: "frais_divers_notaire",
      category: "acquisition",
      label: "Frais divers notaire",
      icon: "📎",
      description: "Timbres, certificats, copies",
      input_mode: "amount",
      hint: "Entre 1 000 et 3 000 DH selon dossier",
    },
    {
      key: "commission_agent",
      category: "acquisition",
      label: "Commission agent immobilier",
      icon: "🏘️",
      description: "Commission négociée avec l'agent",
      input_mode: "percentage",
      percentage: 2.5,
      hint: "Au Maroc : entre 2% et 3% selon négociation",
      contact_type: "agent",
      default_base: "real", // souvent calculée sur le prix réel
    },
    {
      key: "frais_titrage",
      category: "acquisition",
      label: "Frais de titrage (Melkia)",
      icon: "📐",
      description: "Géomètre + bornage + immatriculation",
      input_mode: "amount",
      hint: "Si bien en Melkia ou réquisition",
    },
    {
      key: "diagnostics",
      category: "acquisition",
      label: "Diagnostics & expertises",
      icon: "🔍",
      description: "Expertises techniques du bien",
      input_mode: "amount",
    },

    // Travaux
    {
      key: "travaux",
      category: "travaux",
      label: "Travaux (enveloppe globale)",
      icon: "🔨",
      description: "À détailler en postes plus tard",
      input_mode: "amount",
      hint: "Vous pourrez détailler par corps de métier plus tard",
    },

    // Mobilier
    {
      key: "mobilier",
      category: "mobilier",
      label: "Mobilier & décoration",
      icon: "🪑",
      description: "Ameublement, décoration, électroménager",
      input_mode: "amount",
    },

    // Autre
    {
      key: "autre",
      category: "autre",
      label: "Autre poste",
      icon: "📝",
      description: "Saisie libre",
      input_mode: "amount",
    },
  ];

  const categoryLabels = {
    acquisition: "🏠 Acquisition",
    travaux: "🔨 Travaux",
    mobilier: "🪑 Mobilier & Déco",
    autre: "📝 Autres frais",
  };

  const categoryColors = {
    acquisition: "#D4AF37",
    travaux: "#3B82F6",
    mobilier: "#8B5CF6",
    autre: "#6B7280",
  };

  const costStatusLabels = {
    estime: "Estimé",
    engage: "Engagé",
    paye: "Payé",
  };

  // ============ CALCULS ============
  // Calcule le montant final d'un coût selon son mode de saisie
  const computeCostAmount = (cost) => {
    if (!cost) return 0;
    // Mode split (prix d'achat avec 3 champs) → total = déclaré + cash + frais cash
    if (cost.input_mode === "split") {
      const official = Number(cost.amount_official || 0);
      const cash = Number(cost.amount_cash || 0);
      const cashFees = Number(cost.amount_cash_fees || 0);
      return Math.round(official + cash + cashFees);
    }
    // Mode montant direct
    if (cost.input_mode === "amount" || !cost.input_mode) {
      return Number(cost.amount || 0);
    }
    // Mode pourcentage simple
    if (cost.input_mode === "percentage") {
      const base = Number(cost.base_amount || getPurchasePrice(cost.base_reference) || 0);
      return Math.round(base * Number(cost.percentage || 0) / 100);
    }
    // Mode complexe (% + TVA + forfait) : ex honoraires notaire
    if (cost.input_mode === "complex") {
      const base = Number(cost.base_amount || getPurchasePrice(cost.base_reference) || 0);
      const pct = Number(cost.percentage || 0);
      const tax = Number(cost.tax_rate || 0);
      const fixed = Number(cost.fixed_fee || 0);
      const baseAmount = base * pct / 100;
      const withTax = baseAmount * (1 + tax / 100);
      return Math.round(withTax + fixed);
    }
    return Number(cost.amount || 0);
  };

  // Récupère le prix d'achat selon la base demandée
  // reference = "official" → retourne juste amount_official (800k)
  // reference = "real" → retourne le total (1,180M)
  const getPurchasePrice = (reference = "official") => {
    const purchase = costs.find((c) => c.type_key === "prix_achat");
    if (!purchase) return 0;
    if (purchase.input_mode === "split") {
      if (reference === "real") {
        return Number(purchase.amount_official || 0) + Number(purchase.amount_cash || 0) + Number(purchase.amount_cash_fees || 0);
      }
      return Number(purchase.amount_official || 0);
    }
    // Si pas en mode split, on retourne juste le montant simple
    return Number(purchase.amount || 0);
  };

  // ============ CRUD COSTS ============
  const resetCostForm = () => {
    setCostData({
      type_key: "",
      category: "acquisition",
      label: "",
      input_mode: "amount",
      amount: "",
      percentage: "",
      base_amount: "",
      tax_rate: "",
      fixed_fee: "",
      contact_id: "",
      status: "estime",
      due_date: "",
      compromise_date: "",
      notes: "",
      amount_official: "",
      amount_cash: "",
      amount_cash_fees: "",
      base_reference: "official",
      is_cash: false,
    });
    setEditingCostId(null);
    setShowCostForm(false);
    setCostCatalogOpen(false);
  };

  // Ouvrir le catalogue (choisir un poste pré-défini)
  const openCostCatalog = () => {
    resetCostForm();
    setCostCatalogOpen(true);
  };

  // Sélectionner un poste du catalogue → pré-remplit le formulaire
  const pickCostFromCatalog = (item) => {
    // Base par défaut du poste (définie dans le catalogue)
    const baseRef = item.default_base || "official";
    const purchasePrice = getPurchasePrice(baseRef);
    // Pré-sélection du contact (agent ou notaire) si on a dejà un contact de ce type associé
    let preContactId = "";
    if (item.contact_type) {
      const match = contacts.find((c) => c.type === item.contact_type);
      if (match) preContactId = String(match.id);
      // Pour l'agent, on utilise la commission du contact en priorité
      if (item.contact_type === "agent" && match && match.commission_percentage) {
        item = { ...item, percentage: Number(match.commission_percentage) };
      }
    }
    setCostData({
      type_key: item.key,
      category: item.category,
      label: item.label,
      input_mode: item.input_mode,
      amount: "",
      percentage: item.percentage ? String(item.percentage) : "",
      base_amount: purchasePrice ? String(purchasePrice) : "",
      tax_rate: item.tax_rate ? String(item.tax_rate) : "",
      fixed_fee: item.fixed_fee ? String(item.fixed_fee) : "",
      contact_id: preContactId,
      status: "estime",
      due_date: "",
      compromise_date: "",
      notes: "",
      amount_official: "",
      amount_cash: "",
      amount_cash_fees: "",
      base_reference: baseRef,
      is_cash: false,
    });
    setCostCatalogOpen(false);
    setShowCostForm(true);
  };

  // Ouvrir en mode édition
  const openEditCost = (cost) => {
    setCostData({
      type_key: cost.type_key || "",
      category: cost.category || "acquisition",
      label: cost.label || "",
      input_mode: cost.input_mode || "amount",
      amount: cost.amount ? String(cost.amount) : "",
      percentage: cost.percentage ? String(cost.percentage) : "",
      base_amount: cost.base_amount ? String(cost.base_amount) : "",
      tax_rate: cost.tax_rate ? String(cost.tax_rate) : "",
      fixed_fee: cost.fixed_fee ? String(cost.fixed_fee) : "",
      contact_id: cost.contact_id ? String(cost.contact_id) : "",
      status: cost.status || "estime",
      due_date: cost.due_date ? cost.due_date.substring(0, 10) : "",
      compromise_date: cost.compromise_date ? cost.compromise_date.substring(0, 10) : "",
      notes: cost.notes || "",
      amount_official: cost.amount_official ? String(cost.amount_official) : "",
      amount_cash: cost.amount_cash ? String(cost.amount_cash) : "",
      amount_cash_fees: cost.amount_cash_fees ? String(cost.amount_cash_fees) : "",
      base_reference: cost.base_reference || "official",
      is_cash: cost.is_cash || false,
    });
    setEditingCostId(cost.id);
    setShowCostForm(true);
    setCostMenuOpenId(null);
  };

  const handleCostSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calcul du montant final à stocker
      const finalAmount = computeCostAmount(costData);

      const body = {
        type_key: costData.type_key || null,
        category: costData.category,
        label: costData.label,
        amount: finalAmount,
        currency: project.currency,
        percentage: costData.percentage || null,
        base_amount: costData.base_amount || null,
        tax_rate: costData.tax_rate || null,
        fixed_fee: costData.fixed_fee || null,
        input_mode: costData.input_mode,
        contact_id: costData.contact_id || null,
        status: costData.status,
        due_date: costData.due_date || null,
        compromise_date: costData.compromise_date || null,
        notes: costData.notes,
        // Champs split (pour prix d'achat)
        amount_official: costData.amount_official || null,
        amount_cash: costData.amount_cash || null,
        amount_cash_fees: costData.amount_cash_fees || null,
        base_reference: costData.base_reference || "official",
        is_cash: costData.is_cash || false,
      };

      const url = editingCostId ? `/api/costs/${editingCostId}` : "/api/costs";
      const method = editingCostId ? "PATCH" : "POST";
      const finalBody = editingCostId ? body : { ...body, project_id: Number(id) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      });

      const json = await res.json();
      if (json.success) {
        resetCostForm();
        fetchProject();
      } else {
        alert("Erreur : " + (json.error || "inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  const deleteCost = async (cId) => {
    try {
      const res = await fetch(`/api/costs/${cId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCostDeleteId(null);
        setCostMenuOpenId(null);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Labels en français
  const contactTypeLabels = {
    agent: "Agent immobilier",
    vendeur: "Vendeur",
    notaire: "Notaire",
    architecte: "Architecte",
    banque: "Banque",
    courtier: "Courtier",
    entreprise: "Entreprise / Artisan",
    autre: "Autre",
  };

  const contactTypeIcons = {
    agent: "🏘️",
    vendeur: "💰",
    notaire: "⚖️",
    architecte: "📐",
    banque: "🏦",
    courtier: "💼",
    entreprise: "🔨",
    autre: "👤",
  };

  // Transforme un numéro en URL WhatsApp (wa.me accepte seulement des chiffres, sans +, ni espaces, ni symboles)
  const toWhatsAppUrl = (phone) => {
    if (!phone) return "";
    // Garder uniquement les chiffres (supprime +, espaces, tirets, parenthèses, points)
    const digits = String(phone).replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  };

  const interactionTypeLabels = {
    appel: "📞 Appel",
    email: "📧 Email",
    rdv: "🤝 Rendez-vous",
    visite: "🏠 Visite",
    sms: "💬 SMS / WhatsApp",
    autre: "📝 Autre",
  };

  const tabs = [
    { id: "apercu", label: "Aperçu" },
    { id: "budget", label: "Budget & Coûts" },
    { id: "contacts", label: "Contacts" },
    // { id: "chronologie", label: "Chronologie" }, // TODO Sprint 3 : réactiver quand la feature sera développée
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

  // Calculs de totaux par catégorie (Budget & Coûts)
  const costsByCategory = {
    acquisition: costs.filter((c) => c.category === "acquisition"),
    travaux: costs.filter((c) => c.category === "travaux"),
    mobilier: costs.filter((c) => c.category === "mobilier"),
    autre: costs.filter((c) => c.category === "autre"),
  };
  const totalByCategory = {
    acquisition: costsByCategory.acquisition.reduce((s, c) => s + Number(c.amount || 0), 0),
    travaux: costsByCategory.travaux.reduce((s, c) => s + Number(c.amount || 0), 0),
    mobilier: costsByCategory.mobilier.reduce((s, c) => s + Number(c.amount || 0), 0),
    autre: costsByCategory.autre.reduce((s, c) => s + Number(c.amount || 0), 0),
  };
  const grandTotalCosts = Object.values(totalByCategory).reduce((s, v) => s + v, 0);
  const targetBudget = Number(project?.target_budget || 0);
  const budgetUsagePercent = targetBudget > 0 ? Math.round((grandTotalCosts / targetBudget) * 100) : 0;
  const budgetRemaining = targetBudget - grandTotalCosts;

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
        {/* HEADER PARTAGÉ */}
        <AppHeader />

        {/* MAIN */}
        <main className="main">
          {/* Breadcrumb */}
          <div className="breadcrumb-row">
            <div className="breadcrumb">
              <Link href="/">Tableau de bord</Link>
              <span>/</span>
              <span>{project.name}</span>
            </div>
            <div className="project-actions">
              <button className="btn-action" onClick={openEdit}>
                ✏️ Modifier
              </button>
              <button className="btn-action btn-action-danger" onClick={() => setShowDeleteConfirm(true)}>
                🗑️ Supprimer
              </button>
            </div>
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
              <span className="total-amount">{formatAmount(targetBudget, project.currency)}</span>
              {project.currency !== "EUR" && targetBudget > 0 && (
                <span className="total-eur">≈ {Number(toEUR(targetBudget, project.currency)).toLocaleString("fr-FR")} €</span>
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

                {/* CARD STATUT FONCIER (si pays = Maroc et au moins un champ rempli) */}
                {(project.country || "").toLowerCase().includes("maroc") && (project.land_status || project.requisition_number || project.title_number || project.melkia_reference) && (
                  <div className="info-card land-card">
                    <h3>🇲🇦 Statut foncier</h3>

                    {/* Timeline visuelle */}
                    <div className="land-timeline">
                      <div className={`land-step ${project.land_status === "melkia" || project.land_status === "requisition" || project.land_status === "titre" ? "step-done" : ""}`}>
                        <div className="step-dot"></div>
                        <span>Melkia</span>
                      </div>
                      <div className={`land-line ${project.land_status === "requisition" || project.land_status === "titre" ? "line-done" : ""}`}></div>
                      <div className={`land-step ${project.land_status === "requisition" ? "step-current" : project.land_status === "titre" ? "step-done" : ""}`}>
                        <div className="step-dot"></div>
                        <span>Réquisition</span>
                      </div>
                      <div className={`land-line ${project.land_status === "titre" ? "line-done" : ""}`}></div>
                      <div className={`land-step ${project.land_status === "titre" ? "step-done" : ""}`}>
                        <div className="step-dot"></div>
                        <span>Titre foncier</span>
                      </div>
                    </div>

                    <dl className="info-list" style={{ marginTop: "1.25rem" }}>
                      {project.melkia_reference && (<><dt>Réf. Melkia</dt><dd>{project.melkia_reference}</dd></>)}
                      {project.requisition_number && (<><dt>N° réquisition</dt><dd>{project.requisition_number}</dd></>)}
                      {project.requisition_date && (<><dt>Date réquisition</dt><dd>{new Date(project.requisition_date).toLocaleDateString("fr-FR")}</dd></>)}
                      {project.title_number && (<><dt>N° titre foncier</dt><dd>{project.title_number}</dd></>)}
                      {project.title_date && (<><dt>Date du titre</dt><dd>{new Date(project.title_date).toLocaleDateString("fr-FR")}</dd></>)}
                      {project.conservation_office && (<><dt>Conservation</dt><dd>{project.conservation_office}</dd></>)}
                    </dl>

                    {project.land_notes && (
                      <div className="land-notes">
                        <span className="land-notes-label">Notes :</span>
                        <p>{project.land_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "budget" && (
              <div className="budget-section">
                {/* En-tête avec totaux et progression */}
                <div className="budget-header">
                  <div className="budget-header-title">
                    <h3 className="section-title">Budget & Coûts</h3>
                    <p className="section-subtitle">
                      {costs.length === 0
                        ? "Aucun poste de coût saisi pour le moment"
                        : `${costs.length} poste${costs.length > 1 ? "s" : ""} · ${formatAmount(grandTotalCosts, project.currency)}`}
                    </p>
                  </div>
                  <div className="budget-header-actions">
                    <button className="btn-primary" onClick={openCostCatalog}>
                      + Ajouter un coût
                    </button>
                  </div>
                </div>

                {/* Barre de progression vs budget cible */}
                {targetBudget > 0 && (
                  <div className="budget-progress-card">
                    <div className="progress-top">
                      <div>
                        <span className="progress-label">Budget cible</span>
                        <span className="progress-target">{formatAmount(targetBudget, project.currency)}</span>
                      </div>
                      <div className="progress-right">
                        <span className="progress-label">{budgetUsagePercent > 100 ? "Dépassement" : "Consommé"}</span>
                        <span className={`progress-used ${budgetUsagePercent > 100 ? "over" : ""}`}>
                          {budgetUsagePercent}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${budgetUsagePercent > 100 ? "over" : ""}`}
                        style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                      />
                      {budgetUsagePercent > 100 && (
                        <div className="progress-over-indicator" style={{ width: `${Math.min(budgetUsagePercent - 100, 30)}%` }} />
                      )}
                    </div>
                    <div className="progress-bottom">
                      <span>
                        Consommé : <strong>{formatAmount(grandTotalCosts, project.currency)}</strong>
                        {project.currency !== "EUR" && (
                          <span className="progress-eur"> · ≈ {Number(toEUR(grandTotalCosts, project.currency)).toLocaleString("fr-FR")} €</span>
                        )}
                      </span>
                      <span className={budgetRemaining < 0 ? "over-text" : ""}>
                        {budgetRemaining < 0 ? "Dépassement" : "Reste"} : <strong>{formatAmount(Math.abs(budgetRemaining), project.currency)}</strong>
                        {project.currency !== "EUR" && (
                          <span className="progress-eur"> · ≈ {Number(toEUR(Math.abs(budgetRemaining), project.currency)).toLocaleString("fr-FR")} €</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Donut + Catégories */}
                {costs.length > 0 && (
                  <div className="budget-layout">
                    {/* Donut répartition */}
                    <div className="donut-card">
                      <h4 className="donut-title">Répartition</h4>
                      <div className="donut-wrapper">
                        <svg viewBox="0 0 42 42" className="donut-svg">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#F3F4F6" strokeWidth="4" />
                          {(() => {
                            let offset = 0;
                            const segments = [];
                            for (const cat of ["acquisition", "travaux", "mobilier", "autre"]) {
                              const value = totalByCategory[cat];
                              if (value === 0 || grandTotalCosts === 0) continue;
                              const pct = (value / grandTotalCosts) * 100;
                              segments.push(
                                <circle
                                  key={cat}
                                  cx="21"
                                  cy="21"
                                  r="15.915"
                                  fill="transparent"
                                  stroke={categoryColors[cat]}
                                  strokeWidth="4"
                                  strokeDasharray={`${pct} ${100 - pct}`}
                                  strokeDashoffset={-offset}
                                  transform="rotate(-90 21 21)"
                                />
                              );
                              offset += pct;
                            }
                            return segments;
                          })()}
                        </svg>
                        <div className="donut-center">
                          <span className="donut-center-value">{formatAmount(grandTotalCosts, project.currency)}</span>
                          <span className="donut-center-label">Total</span>
                        </div>
                      </div>
                      <ul className="donut-legend">
                        {["acquisition", "travaux", "mobilier", "autre"].map((cat) => {
                          const value = totalByCategory[cat];
                          if (value === 0) return null;
                          const pct = grandTotalCosts > 0 ? Math.round((value / grandTotalCosts) * 100) : 0;
                          return (
                            <li key={cat}>
                              <span className="legend-dot" style={{ background: categoryColors[cat] }}></span>
                              <span className="legend-label">{categoryLabels[cat]}</span>
                              <span className="legend-value">{pct}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Liste par catégorie */}
                    <div className="costs-list">
                      {["acquisition", "travaux", "mobilier", "autre"].map((cat) => {
                        const items = costsByCategory[cat];
                        if (items.length === 0) return null;

                        return (
                          <div key={cat} className="cost-category">
                            <div className="cat-header">
                              <h4>
                                <span className="cat-color" style={{ background: categoryColors[cat] }}></span>
                                {categoryLabels[cat]}
                              </h4>
                              <span className="cat-total">{formatAmount(totalByCategory[cat], project.currency)}</span>
                            </div>
                            <div className="cost-items">
                              {items.map((c) => (
                                <div key={c.id} className="cost-item">
                                  <div className="cost-main">
                                    <div className="cost-label-row">
                                      <span className="cost-label">{c.label}</span>
                                      <span className={`cost-status status-${c.status}`}>
                                        {costStatusLabels[c.status] || c.status}
                                      </span>
                                      {c.is_cash && (
                                        <span className="cash-tag">💵 CASH</span>
                                      )}
                                    </div>
                                    <div className="cost-meta">
                                      {c.input_mode === "split" && (
                                        <span className="cost-tag">Déclaré {formatAmount(c.amount_official, project.currency)} + Cash {formatAmount((Number(c.amount_cash) || 0) + (Number(c.amount_cash_fees) || 0), project.currency)}</span>
                                      )}
                                      {c.input_mode === "percentage" && c.percentage && (
                                        <span className="cost-tag">
                                          {c.percentage}% × {formatAmount(c.base_amount || 0, project.currency)}
                                          {c.base_reference === "real" && <span className="base-ref-indicator"> (prix réel)</span>}
                                        </span>
                                      )}
                                      {c.input_mode === "complex" && (
                                        <span className="cost-tag">
                                          {c.percentage}% × {formatAmount(c.base_amount || 0, project.currency)} + TVA {c.tax_rate}% + {formatAmount(c.fixed_fee, project.currency)}
                                          {c.base_reference === "real" && <span className="base-ref-indicator"> (prix réel)</span>}
                                        </span>
                                      )}
                                      {c.contact_name && (
                                        <span className="cost-contact">→ {c.contact_name}</span>
                                      )}
                                      {c.compromise_date && (
                                        <span className="cost-date">📅 Compromis : {new Date(c.compromise_date).toLocaleDateString("fr-FR")}</span>
                                      )}
                                      {c.due_date && (
                                        <span className="cost-date">📅 Acte : {new Date(c.due_date).toLocaleDateString("fr-FR")}</span>
                                      )}
                                    </div>
                                    {/* Sous-lignes visuelles pour le prix d'achat en mode split */}
                                    {c.input_mode === "split" && (
                                      <div className="split-sublines">
                                        <div className="subline">
                                          <span className="subline-label">💳 Déclaré / virement</span>
                                          <span className="subline-value">{formatAmount(c.amount_official, project.currency)}</span>
                                        </div>
                                        {Number(c.amount_cash) > 0 && (
                                          <div className="subline subline-cash">
                                            <span className="subline-label">💵 Cash</span>
                                            <span className="subline-value">{formatAmount(c.amount_cash, project.currency)}</span>
                                          </div>
                                        )}
                                        {Number(c.amount_cash_fees) > 0 && (
                                          <div className="subline subline-cash">
                                            <span className="subline-label">💵 Frais d'acquisition</span>
                                            <span className="subline-value">{formatAmount(c.amount_cash_fees, project.currency)}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="cost-right">
                                    <span className="cost-amount">{formatAmount(c.amount, project.currency)}</span>
                                    {project.currency !== "EUR" && (
                                      <span className="cost-amount-eur">≈ {Number(toEUR(c.amount, project.currency)).toLocaleString("fr-FR")} €</span>
                                    )}
                                  </div>
                                  <div className="cost-menu-wrapper">
                                    <button
                                      className="menu-trigger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCostMenuOpenId(costMenuOpenId === c.id ? null : c.id);
                                      }}
                                      aria-label="Options"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="5" r="2" />
                                        <circle cx="12" cy="12" r="2" />
                                        <circle cx="12" cy="19" r="2" />
                                      </svg>
                                    </button>
                                    {costMenuOpenId === c.id && (
                                      <>
                                        <div className="menu-backdrop" onClick={() => setCostMenuOpenId(null)} />
                                        <div className="menu-dropdown">
                                          <button className="menu-item" onClick={() => openEditCost(c)}>
                                            ✏️ Modifier
                                          </button>
                                          <button
                                            className="menu-item menu-item-danger"
                                            onClick={() => {
                                              setCostDeleteId(c.id);
                                              setCostMenuOpenId(null);
                                            }}
                                          >
                                            🗑️ Supprimer
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* État vide */}
                {costs.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon-big">💰</div>
                    <h4>Aucun poste de coût</h4>
                    <p>Commencez par ajouter le prix d'achat, les frais notaire, la commission agent, etc. Les postes courants au Maroc sont pré-configurés.</p>
                    <button className="btn-primary" onClick={openCostCatalog}>
                      + Ajouter un premier coût
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="contacts-section">
                {/* Header avec boutons ajouter */}
                <div className="contacts-header">
                  <div>
                    <h3 className="section-title">Contacts du projet</h3>
                    <p className="section-subtitle">
                      {contacts.length === 0
                        ? "Aucun contact associé pour le moment"
                        : `${contacts.length} contact${contacts.length > 1 ? "s" : ""} associé${contacts.length > 1 ? "s" : ""} à ce projet`}
                    </p>
                  </div>
                  <div className="contacts-header-actions">
                    <button className="btn-outline" onClick={openPickContactForm}>
                      📇 Choisir dans le carnet
                    </button>
                    <button className="btn-primary" onClick={openNewContactForm}>
                      + Nouveau contact
                    </button>
                  </div>
                </div>

                {/* Liste des contacts groupés par type */}
                {contacts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-big">📇</div>
                    <h4>Aucun contact associé</h4>
                    <p>Créez un nouveau contact ou choisissez-en un dans votre carnet d'adresses global (partagé entre tous vos projets).</p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <button className="btn-outline" onClick={openPickContactForm}>
                        📇 Choisir dans le carnet
                      </button>
                      <button className="btn-primary" onClick={openNewContactForm}>
                        + Créer un nouveau contact
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="contacts-grid">
                    {contacts.map((c) => {
                      const contactInteractions = interactions.filter((i) => i.contact_id === c.id);
                      const isExpanded = expandedContactId === c.id;
                      const commissionLabel = c.commission_percentage
                        ? `${c.commission_percentage}%`
                        : c.commission_amount
                        ? formatAmount(c.commission_amount, project.currency)
                        : null;

                      return (
                        <div key={c.id} className="contact-card">
                          <div className="contact-top">
                            <div className="contact-avatar">{contactTypeIcons[c.type] || "👤"}</div>
                            <div className="contact-info">
                              <span className="contact-type-badge">{contactTypeLabels[c.type] || c.type}</span>
                              <h4 className="contact-name">{c.name}</h4>
                              {(c.company || c.project_role || c.role) && (
                                <p className="contact-role">
                                  {c.project_role || c.role}
                                  {(c.project_role || c.role) && c.company ? " · " : ""}
                                  {c.company}
                                </p>
                              )}
                            </div>
                            <div className="contact-menu-wrapper">
                              <button
                                className="menu-trigger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContactMenuOpenId(contactMenuOpenId === c.id ? null : c.id);
                                }}
                                aria-label="Options"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="5" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="12" cy="19" r="2" />
                                </svg>
                              </button>
                              {contactMenuOpenId === c.id && (
                                <>
                                  <div className="menu-backdrop" onClick={() => setContactMenuOpenId(null)} />
                                  <div className="menu-dropdown">
                                    <button className="menu-item" onClick={() => openEditContact(c)}>
                                      ✏️ Modifier les infos
                                    </button>
                                    <button className="menu-item" onClick={() => openEditAssociation(c)}>
                                      💰 Modifier commission
                                    </button>
                                    <button
                                      className="menu-item"
                                      onClick={() => {
                                        setContactUnlinkId(c.association_id);
                                        setContactMenuOpenId(null);
                                      }}
                                    >
                                      🔗 Retirer du projet
                                    </button>
                                    <button
                                      className="menu-item menu-item-danger"
                                      onClick={() => {
                                        setContactDeleteId(c.id);
                                        setContactMenuOpenId(null);
                                      }}
                                    >
                                      🗑️ Supprimer du carnet
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="contact-details">
                            {c.email && (
                              <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <a href={`mailto:${c.email}`} className="detail-value detail-link">{c.email}</a>
                              </div>
                            )}
                            {c.phone && (
                              <div className="detail-row">
                                <span className="detail-label">Téléphone</span>
                                <a
                                  href={toWhatsAppUrl(c.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="detail-value detail-link whatsapp-link"
                                  title="Ouvrir dans WhatsApp"
                                >
                                  <span className="wa-icon" aria-hidden>💬</span> {c.phone}
                                </a>
                              </div>
                            )}
                            {c.address && (
                              <div className="detail-row">
                                <span className="detail-label">Adresse</span>
                                <span className="detail-value">{c.address}</span>
                              </div>
                            )}
                            {commissionLabel && (
                              <div className="detail-row">
                                <span className="detail-label">Commission</span>
                                <span className="detail-value detail-highlight">{commissionLabel}</span>
                              </div>
                            )}
                            {c.iban && (
                              <div className="detail-row">
                                <span className="detail-label">IBAN / RIB</span>
                                <span className="detail-value detail-mono">{c.iban}</span>
                              </div>
                            )}
                            {c.website && (
                              <div className="detail-row">
                                <span className="detail-label">Site web</span>
                                <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="detail-value detail-link">{c.website}</a>
                              </div>
                            )}
                            {c.notes && (
                              <div className="contact-notes">
                                <p>{c.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Bouton pour déplier l'historique */}
                          <button
                            className="toggle-interactions"
                            onClick={() => setExpandedContactId(isExpanded ? null : c.id)}
                          >
                            {isExpanded ? "▼" : "▶"} Historique des échanges
                            {contactInteractions.length > 0 && (
                              <span className="interactions-count">{contactInteractions.length}</span>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="interactions-section">
                              <div className="interactions-header">
                                <button
                                  className="btn-mini"
                                  onClick={() => openInteractionForm(c.id)}
                                >
                                  + Ajouter un échange
                                </button>
                              </div>

                              {/* Formulaire d'ajout d'interaction (inline) */}
                              {showInteractionForm === c.id && (
                                <form
                                  className="interaction-form"
                                  onSubmit={(e) => handleInteractionSubmit(e, c.id)}
                                >
                                  <div className="row">
                                    <label>
                                      <span>Type</span>
                                      <select
                                        value={interactionData.type}
                                        onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })}
                                      >
                                        <option value="appel">📞 Appel</option>
                                        <option value="email">📧 Email</option>
                                        <option value="rdv">🤝 Rendez-vous</option>
                                        <option value="visite">🏠 Visite</option>
                                        <option value="sms">💬 SMS / WhatsApp</option>
                                        <option value="autre">📝 Autre</option>
                                      </select>
                                    </label>
                                    <label>
                                      <span>Date</span>
                                      <input
                                        type="date"
                                        value={interactionData.interaction_date}
                                        onChange={(e) => setInteractionData({ ...interactionData, interaction_date: e.target.value })}
                                      />
                                    </label>
                                  </div>
                                  <label>
                                    <span>Sujet</span>
                                    <input
                                      type="text"
                                      value={interactionData.subject}
                                      onChange={(e) => setInteractionData({ ...interactionData, subject: e.target.value })}
                                      placeholder="Ex: Visite du bien, discussion tarifs..."
                                    />
                                  </label>
                                  <label>
                                    <span>Notes</span>
                                    <textarea
                                      rows="2"
                                      value={interactionData.notes}
                                      onChange={(e) => setInteractionData({ ...interactionData, notes: e.target.value })}
                                      placeholder="Détails, points abordés, décisions prises..."
                                    />
                                  </label>
                                  <div className="interaction-form-actions">
                                    <button type="button" className="btn-ghost btn-mini" onClick={() => setShowInteractionForm(null)}>
                                      Annuler
                                    </button>
                                    <button type="submit" className="btn-primary btn-mini">
                                      Enregistrer
                                    </button>
                                  </div>
                                </form>
                              )}

                              {/* Liste des interactions */}
                              {contactInteractions.length === 0 ? (
                                <p className="empty-interactions">Aucun échange enregistré</p>
                              ) : (
                                <ul className="interactions-list">
                                  {contactInteractions.map((inter) => (
                                    <li key={inter.id} className="interaction-item">
                                      <div className="interaction-header">
                                        <span className="interaction-type">
                                          {interactionTypeLabels[inter.type] || inter.type}
                                        </span>
                                        <span className="interaction-date">
                                          {new Date(inter.interaction_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        <button
                                          className="interaction-delete"
                                          onClick={() => deleteInteraction(inter.id)}
                                          aria-label="Supprimer"
                                          title="Supprimer cet échange"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      {inter.subject && <div className="interaction-subject">{inter.subject}</div>}
                                      {inter.notes && <div className="interaction-notes">{inter.notes}</div>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
  <DocumentsTab projectId={project?.id} />
)}
          </section>
        </main>

        {/* MODAL ÉDITION */}
        {showEdit && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setShowEdit(false); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Modifier le projet</h2>
                <button className="close-btn" onClick={() => setShowEdit(false)}>×</button>
              </div>
              <form onSubmit={handleEditSubmit} className="modal-form">
                <label>
                  <span>Nom du projet *</span>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </label>
                <label>
                  <span>Statut</span>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <option value="prospection">Prospection</option>
                    <option value="negociation">Négociation</option>
                    <option value="compromis">Compromis signé</option>
                    <option value="acte">Acte authentique</option>
                    <option value="travaux">Travaux en cours</option>
                    <option value="livre">Livré</option>
                  </select>
                </label>
                <div className="row">
                  <label>
                    <span>Pays</span>
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Ville</span>
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  <span>Adresse précise</span>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </label>
                <div className="row">
                  <label>
                    <span>Budget total cible</span>
                    <input
                      type="number"
                      value={editData.target_budget}
                      onChange={(e) => setEditData({ ...editData, target_budget: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Devise locale</span>
                    <select
                      value={editData.currency}
                      onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                    >
                      <option value="MAD">MAD — Dirham marocain</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — Dollar US</option>
                      <option value="GBP">GBP — Livre sterling</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>Type de bien</span>
                  <input
                    type="text"
                    value={editData.property_type}
                    onChange={(e) => setEditData({ ...editData, property_type: e.target.value })}
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    rows="3"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </label>

                {/* STATUT FONCIER MAROC */}
                {(editData.country || "").toLowerCase().includes("maroc") && (
                  <>
                    <div className="section-divider">
                      <span>🇲🇦 Statut foncier (Maroc)</span>
                    </div>

                    <label>
                      <span>Statut foncier actuel</span>
                      <select
                        value={editData.land_status}
                        onChange={(e) => setEditData({ ...editData, land_status: e.target.value })}
                      >
                        <option value="">— Non renseigné —</option>
                        <option value="melkia">Melkia (non titré)</option>
                        <option value="requisition">Réquisition en cours</option>
                        <option value="titre">Titre foncier (immatriculé)</option>
                      </select>
                    </label>

                    {(editData.land_status === "melkia" || editData.land_status === "requisition") && (
                      <label>
                        <span>Référence Melkia (acte adoulaire)</span>
                        <input
                          type="text"
                          value={editData.melkia_reference}
                          onChange={(e) => setEditData({ ...editData, melkia_reference: e.target.value })}
                          placeholder="Numéro ou référence de l'acte"
                        />
                      </label>
                    )}

                    {(editData.land_status === "requisition" || editData.land_status === "titre") && (
                      <div className="row">
                        <label>
                          <span>N° de réquisition</span>
                          <input
                            type="text"
                            value={editData.requisition_number}
                            onChange={(e) => setEditData({ ...editData, requisition_number: e.target.value })}
                            placeholder="Ex: R 12345/24"
                          />
                        </label>
                        <label>
                          <span>Date de réquisition</span>
                          <input
                            type="date"
                            value={editData.requisition_date}
                            onChange={(e) => setEditData({ ...editData, requisition_date: e.target.value })}
                          />
                        </label>
                      </div>
                    )}

                    {editData.land_status === "titre" && (
                      <div className="row">
                        <label>
                          <span>N° de titre foncier</span>
                          <input
                            type="text"
                            value={editData.title_number}
                            onChange={(e) => setEditData({ ...editData, title_number: e.target.value })}
                            placeholder="Ex: TF 98765/M"
                          />
                        </label>
                        <label>
                          <span>Date du titre</span>
                          <input
                            type="date"
                            value={editData.title_date}
                            onChange={(e) => setEditData({ ...editData, title_date: e.target.value })}
                          />
                        </label>
                      </div>
                    )}

                    {editData.land_status && (
                      <>
                        <label>
                          <span>Conservation foncière</span>
                          <input
                            type="text"
                            value={editData.conservation_office}
                            onChange={(e) => setEditData({ ...editData, conservation_office: e.target.value })}
                            placeholder="Ex: Marrakech Médina"
                          />
                        </label>
                        <label>
                          <span>Notes foncières</span>
                          <textarea
                            rows="2"
                            value={editData.land_notes}
                            onChange={(e) => setEditData({ ...editData, land_notes: e.target.value })}
                            placeholder="Clauses suspensives, bornage, observations, oppositions, etc."
                          />
                        </label>
                      </>
                    )}
                  </>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowEdit(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION SUPPRESSION */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setShowDeleteConfirm(false); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Supprimer le projet ?</h2>
                <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
              </div>
              <div className="modal-body-text">
                <p>Cette action est <strong>irréversible</strong>.</p>
                <p>Tous les contacts, coûts, postes travaux, documents et étapes de chronologie liés à ce projet seront également supprimés définitivement.</p>
              </div>
              <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </button>
                <button type="button" className="btn-danger" onClick={handleDelete}>
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CATALOGUE DES POSTES DE COÛT */}
        {costCatalogOpen && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setCostCatalogOpen(false); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Choisir un type de coût</h2>
                <button className="close-btn" onClick={() => setCostCatalogOpen(false)}>×</button>
              </div>
              <div className="info-banner">
                Postes pré-configurés pour l'immobilier au Maroc. Sélectionnez un poste, les % standards seront pré-remplis (vous pourrez les ajuster).
              </div>
              <div className="catalog-list">
                {["acquisition", "travaux", "mobilier", "autre"].map((cat) => {
                  const items = costCatalog.filter((i) => i.category === cat);
                  return (
                    <div key={cat} className="catalog-category">
                      <h4 className="catalog-cat-title">
                        <span className="cat-color" style={{ background: categoryColors[cat] }}></span>
                        {categoryLabels[cat]}
                      </h4>
                      <div className="catalog-items">
                        {items.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            className="catalog-item"
                            onClick={() => pickCostFromCatalog(item)}
                          >
                            <span className="catalog-icon">{item.icon}</span>
                            <div className="catalog-text">
                              <div className="catalog-label">{item.label}</div>
                              <div className="catalog-description">{item.description}</div>
                              {item.hint && <div className="catalog-hint">💡 {item.hint}</div>}
                            </div>
                            {item.percentage && (
                              <span className="catalog-pct">{item.percentage}%</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORMULAIRE COÛT */}
        {showCostForm && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") resetCostForm(); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>{editingCostId ? "Modifier le coût" : "Nouveau coût"}</h2>
                <button className="close-btn" onClick={resetCostForm}>×</button>
              </div>
              <form onSubmit={handleCostSubmit} className="modal-form">
                <div className="row">
                  <label>
                    <span>Catégorie *</span>
                    <select
                      required
                      value={costData.category}
                      onChange={(e) => setCostData({ ...costData, category: e.target.value })}
                    >
                      <option value="acquisition">🏠 Acquisition</option>
                      <option value="travaux">🔨 Travaux</option>
                      <option value="mobilier">🪑 Mobilier & Déco</option>
                      <option value="autre">📝 Autres frais</option>
                    </select>
                  </label>
                  <label>
                    <span>Statut</span>
                    <select
                      value={costData.status}
                      onChange={(e) => setCostData({ ...costData, status: e.target.value })}
                    >
                      <option value="estime">Estimé</option>
                      <option value="engage">Engagé</option>
                      <option value="paye">Payé</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Libellé *</span>
                  <input
                    type="text"
                    required
                    value={costData.label}
                    onChange={(e) => setCostData({ ...costData, label: e.target.value })}
                    placeholder="Ex: Prix d'achat du bien"
                  />
                </label>

                {/* Mode de saisie : toggle */}
                <div className="section-divider">
                  <span>💰 Montant</span>
                </div>
                <div className="commission-toggle mode-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${costData.input_mode === "amount" ? "toggle-active" : ""}`}
                    onClick={() => setCostData({ ...costData, input_mode: "amount" })}
                  >
                    Montant fixe
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${costData.input_mode === "percentage" ? "toggle-active" : ""}`}
                    onClick={() => setCostData({ ...costData, input_mode: "percentage" })}
                  >
                    % du prix
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${costData.input_mode === "complex" ? "toggle-active" : ""}`}
                    onClick={() => setCostData({ ...costData, input_mode: "complex" })}
                  >
                    % + TVA + forfait
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${costData.input_mode === "split" ? "toggle-active" : ""}`}
                    onClick={() => setCostData({ ...costData, input_mode: "split" })}
                  >
                    Déclaré + Cash 💵
                  </button>
                </div>

                {/* Saisie selon le mode */}
                {costData.input_mode === "amount" && (
                  <label>
                    <span>Montant ({project.currency})</span>
                    <input
                      type="number"
                      value={costData.amount}
                      onChange={(e) => setCostData({ ...costData, amount: e.target.value })}
                      placeholder="0"
                    />
                  </label>
                )}

                {/* ===== MODE SPLIT : prix d'achat avec 3 champs (spécifique Maroc) ===== */}
                {costData.input_mode === "split" && (
                  <>
                    <div className="split-banner">
                      💡 <strong>Spécifique Maroc</strong> : séparez la part déclarée (virement notaire, base des frais officiels) de la part cash (budget réel uniquement).
                    </div>
                    <label>
                      <span>💳 Part déclarée / virement notaire ({project.currency})</span>
                      <input
                        type="number"
                        value={costData.amount_official}
                        onChange={(e) => setCostData({ ...costData, amount_official: e.target.value })}
                        placeholder="Ex: 800 000"
                      />
                      <small className="field-hint">Ce montant figurera sur l'acte notarié et servira de base aux frais (notaire, enregistrement, conservation).</small>
                    </label>
                    <label>
                      <span>💵 Part cash (complément) ({project.currency})</span>
                      <input
                        type="number"
                        value={costData.amount_cash}
                        onChange={(e) => setCostData({ ...costData, amount_cash: e.target.value })}
                        placeholder="Ex: 350 000"
                      />
                      <small className="field-hint">Complément cash versé au vendeur (non déclaré).</small>
                    </label>
                    <label>
                      <span>💵 Frais d'acquisition ({project.currency})</span>
                      <input
                        type="number"
                        value={costData.amount_cash_fees}
                        onChange={(e) => setCostData({ ...costData, amount_cash_fees: e.target.value })}
                        placeholder="Ex: 30 000"
                      />
                      <small className="field-hint">Participation cash aux frais d'acquisition.</small>
                    </label>
                    <div className="calc-preview split-preview">
                      <div className="split-line">
                        <span>Prix déclaré (base des frais officiels) :</span>
                        <strong>{formatAmount(costData.amount_official || 0, project.currency)}</strong>
                      </div>
                      <div className="split-line cash-line">
                        <span>💵 Total cash :</span>
                        <strong>{formatAmount((Number(costData.amount_cash) || 0) + (Number(costData.amount_cash_fees) || 0), project.currency)}</strong>
                      </div>
                      <div className="split-line split-total">
                        <span>Prix d'achat réel (budget global) :</span>
                        <strong>{formatAmount(computeCostAmount(costData), project.currency)}</strong>
                      </div>
                    </div>
                  </>
                )}

                {costData.input_mode === "percentage" && (
                  <>
                    {/* Sélecteur de base pour le calcul */}
                    {getPurchasePrice("real") > 0 && getPurchasePrice("real") !== getPurchasePrice("official") && (
                      <div className="base-ref-selector">
                        <span className="base-ref-label">Calcul sur :</span>
                        <label className="base-ref-option">
                          <input
                            type="radio"
                            name="base_ref"
                            checked={costData.base_reference === "official"}
                            onChange={() => setCostData({ ...costData, base_reference: "official", base_amount: String(getPurchasePrice("official")) })}
                          />
                          <span>Prix déclaré : <strong>{formatAmount(getPurchasePrice("official"), project.currency)}</strong></span>
                        </label>
                        <label className="base-ref-option">
                          <input
                            type="radio"
                            name="base_ref"
                            checked={costData.base_reference === "real"}
                            onChange={() => setCostData({ ...costData, base_reference: "real", base_amount: String(getPurchasePrice("real")) })}
                          />
                          <span>Prix réel : <strong>{formatAmount(getPurchasePrice("real"), project.currency)}</strong></span>
                        </label>
                      </div>
                    )}
                    <div className="row">
                      <label>
                        <span>Pourcentage (%)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={costData.percentage}
                          onChange={(e) => setCostData({ ...costData, percentage: e.target.value })}
                          placeholder="Ex: 4"
                        />
                      </label>
                      <label>
                        <span>Base de calcul ({project.currency})</span>
                        <input
                          type="number"
                          value={costData.base_amount}
                          onChange={(e) => setCostData({ ...costData, base_amount: e.target.value })}
                          placeholder="Prix d'achat par défaut"
                        />
                      </label>
                    </div>
                    {costData.percentage && costData.base_amount && (
                      <div className="calc-preview">
                        = {formatAmount(computeCostAmount(costData), project.currency)}
                      </div>
                    )}
                  </>
                )}

                {costData.input_mode === "complex" && (
                  <>
                    {/* Sélecteur de base pour le calcul */}
                    {getPurchasePrice("real") > 0 && getPurchasePrice("real") !== getPurchasePrice("official") && (
                      <div className="base-ref-selector">
                        <span className="base-ref-label">Calcul sur :</span>
                        <label className="base-ref-option">
                          <input
                            type="radio"
                            name="base_ref_cmplx"
                            checked={costData.base_reference === "official"}
                            onChange={() => setCostData({ ...costData, base_reference: "official", base_amount: String(getPurchasePrice("official")) })}
                          />
                          <span>Prix déclaré : <strong>{formatAmount(getPurchasePrice("official"), project.currency)}</strong></span>
                        </label>
                        <label className="base-ref-option">
                          <input
                            type="radio"
                            name="base_ref_cmplx"
                            checked={costData.base_reference === "real"}
                            onChange={() => setCostData({ ...costData, base_reference: "real", base_amount: String(getPurchasePrice("real")) })}
                          />
                          <span>Prix réel : <strong>{formatAmount(getPurchasePrice("real"), project.currency)}</strong></span>
                        </label>
                      </div>
                    )}
                    <div className="row">
                      <label>
                        <span>Pourcentage (%)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={costData.percentage}
                          onChange={(e) => setCostData({ ...costData, percentage: e.target.value })}
                          placeholder="Ex: 1"
                        />
                      </label>
                      <label>
                        <span>Base ({project.currency})</span>
                        <input
                          type="number"
                          value={costData.base_amount}
                          onChange={(e) => setCostData({ ...costData, base_amount: e.target.value })}
                          placeholder="Prix d'achat"
                        />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        <span>TVA (%)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={costData.tax_rate}
                          onChange={(e) => setCostData({ ...costData, tax_rate: e.target.value })}
                          placeholder="Ex: 20"
                        />
                      </label>
                      <label>
                        <span>Forfait fixe ({project.currency})</span>
                        <input
                          type="number"
                          value={costData.fixed_fee}
                          onChange={(e) => setCostData({ ...costData, fixed_fee: e.target.value })}
                          placeholder="Ex: 150"
                        />
                      </label>
                    </div>
                    {costData.percentage && costData.base_amount && (
                      <div className="calc-preview">
                        Calcul : {costData.base_amount} × {costData.percentage}% × (1 + {costData.tax_rate || 0}%) + {costData.fixed_fee || 0} =
                        <strong> {formatAmount(computeCostAmount(costData), project.currency)}</strong>
                      </div>
                    )}
                  </>
                )}

                <div className="section-divider">
                  <span>Détails</span>
                </div>

                <label>
                  <span>Contact associé (optionnel)</span>
                  <select
                    value={costData.contact_id}
                    onChange={(e) => setCostData({ ...costData, contact_id: e.target.value })}
                  >
                    <option value="">— Aucun contact —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {contactTypeIcons[c.type] || "👤"} {c.name} ({contactTypeLabels[c.type] || c.type})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="row">
                  <label>
                    <span>📅 Date compromis</span>
                    <input
                      type="date"
                      value={costData.compromise_date}
                      onChange={(e) => setCostData({ ...costData, compromise_date: e.target.value })}
                    />
                    <small className="field-hint">Paiement prévu à la signature du compromis (ex: acompte)</small>
                  </label>
                  <label>
                    <span>📅 Date acte définitif</span>
                    <input
                      type="date"
                      value={costData.due_date}
                      onChange={(e) => setCostData({ ...costData, due_date: e.target.value })}
                    />
                    <small className="field-hint">Paiement prévu à la signature de l'acte</small>
                  </label>
                </div>

                <label>
                  <span>Notes</span>
                  <textarea
                    rows="2"
                    value={costData.notes}
                    onChange={(e) => setCostData({ ...costData, notes: e.target.value })}
                    placeholder="Informations complémentaires..."
                  />
                </label>

                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={resetCostForm}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCostId ? "Enregistrer" : "Ajouter le coût"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION SUPPRESSION COÛT */}
        {costDeleteId && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setCostDeleteId(null); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Supprimer ce coût ?</h2>
                <button className="close-btn" onClick={() => setCostDeleteId(null)}>×</button>
              </div>
              <div className="modal-body-text">
                <p>Cette action est <strong>irréversible</strong>.</p>
              </div>
              <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setCostDeleteId(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-danger" onClick={() => deleteCost(costDeleteId)}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONTACT : NEW / PICK / EDIT / ASSOC */}
        {showContactForm && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") resetContactForm(); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>
                  {contactFormMode === "new" && "Nouveau contact"}
                  {contactFormMode === "pick" && "Choisir dans le carnet"}
                  {contactFormMode === "edit" && "Modifier le contact"}
                  {contactFormMode === "assoc" && "Modifier la commission"}
                </h2>
                <button className="close-btn" onClick={resetContactForm}>×</button>
              </div>

              {/* Bandeau d'info pour expliquer le contexte */}
              {contactFormMode === "new" && (
                <div className="info-banner">
                  Ce contact sera ajouté à votre carnet d'adresses global (réutilisable sur tous vos projets) et automatiquement associé à ce projet.
                  <button type="button" className="link-btn" onClick={openPickContactForm}>
                    Choisir un contact existant ↗
                  </button>
                </div>
              )}
              {contactFormMode === "edit" && (
                <div className="info-banner">
                  Vous modifiez les informations du <strong>carnet global</strong>. Ces changements s'appliqueront à tous les projets liés à ce contact.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="modal-form">

                {/* Mode PICK : sélectionner un contact du carnet */}
                {contactFormMode === "pick" && (
                  <>
                    <label>
                      <span>Contact à associer *</span>
                      <select
                        required
                        value={pickContactId}
                        onChange={(e) => setPickContactId(e.target.value)}
                      >
                        <option value="">— Choisir un contact —</option>
                        {availableContacts.length === 0 ? (
                          <option disabled>Votre carnet est vide ou tous déjà associés</option>
                        ) : (
                          availableContacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {contactTypeIcons[c.type] || "👤"} {contactTypeLabels[c.type]} · {c.name}
                              {c.company ? ` (${c.company})` : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <button type="button" className="link-btn" onClick={openNewContactForm}>
                      Plutôt créer un nouveau contact ↗
                    </button>
                  </>
                )}

                {/* Champs contact (pour NEW et EDIT) */}
                {(contactFormMode === "new" || contactFormMode === "edit") && (
                  <>
                    <div className="row">
                      <label>
                        <span>Type de contact *</span>
                        <select
                          required
                          value={contactData.type}
                          onChange={(e) => setContactData({ ...contactData, type: e.target.value })}
                        >
                          <option value="agent">🏘️ Agent immobilier</option>
                          <option value="vendeur">💰 Vendeur</option>
                          <option value="notaire">⚖️ Notaire</option>
                          <option value="architecte">📐 Architecte</option>
                          <option value="banque">🏦 Banque</option>
                          <option value="courtier">💼 Courtier</option>
                          <option value="entreprise">🔨 Entreprise / Artisan</option>
                          <option value="autre">👤 Autre</option>
                        </select>
                      </label>
                      <label>
                        <span>Nom / Prénom *</span>
                        <input
                          type="text"
                          required
                          value={contactData.name}
                          onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                          placeholder="Sophie Martin"
                        />
                      </label>
                    </div>

                    <div className="row">
                      <label>
                        <span>Société / Cabinet / Étude</span>
                        <input
                          type="text"
                          value={contactData.company}
                          onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                          placeholder="Cabinet Notaire Alaoui"
                        />
                      </label>
                      <label>
                        <span>Fonction / Rôle</span>
                        <input
                          type="text"
                          value={contactData.role}
                          onChange={(e) => setContactData({ ...contactData, role: e.target.value })}
                          placeholder="Notaire titulaire"
                        />
                      </label>
                    </div>

                    <div className="row">
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={contactData.email}
                          onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                          placeholder="contact@exemple.com"
                        />
                      </label>
                      <label>
                        <span>Téléphone</span>
                        <input
                          type="tel"
                          value={contactData.phone}
                          onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                          placeholder="+212 6 12 34 56 78"
                        />
                      </label>
                    </div>

                    <label>
                      <span>Adresse</span>
                      <input
                        type="text"
                        value={contactData.address}
                        onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                        placeholder="Rue Mohammed V, Marrakech"
                      />
                    </label>

                    <div className="row">
                      <label>
                        <span>IBAN / RIB</span>
                        <input
                          type="text"
                          value={contactData.iban}
                          onChange={(e) => setContactData({ ...contactData, iban: e.target.value })}
                          placeholder="MA64 ..."
                        />
                      </label>
                      <label>
                        <span>Site web</span>
                        <input
                          type="text"
                          value={contactData.website}
                          onChange={(e) => setContactData({ ...contactData, website: e.target.value })}
                          placeholder="www.exemple.com"
                        />
                      </label>
                    </div>

                    <label>
                      <span>Notes (carnet global)</span>
                      <textarea
                        rows="2"
                        value={contactData.notes}
                        onChange={(e) => setContactData({ ...contactData, notes: e.target.value })}
                        placeholder="Horaires, spécialités, recommandé par..."
                      />
                    </label>
                  </>
                )}

                {/* Champs projet (commission, rôle projet, notes projet) pour NEW / PICK / ASSOC */}
                {(contactFormMode === "new" || contactFormMode === "pick" || contactFormMode === "assoc") && (
                  <>
                    <div className="section-divider">
                      <span>💰 Pour ce projet</span>
                    </div>

                    <label>
                      <span>Rôle sur ce projet</span>
                      <input
                        type="text"
                        value={contactData.project_role}
                        onChange={(e) => setContactData({ ...contactData, project_role: e.target.value })}
                        placeholder="Ex: Notaire principal, Agent vendeur..."
                      />
                    </label>

                    <div className="commission-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${contactData.commission_mode === "percentage" ? "toggle-active" : ""}`}
                        onClick={() => setContactData({ ...contactData, commission_mode: "percentage" })}
                      >
                        En pourcentage (%)
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${contactData.commission_mode === "amount" ? "toggle-active" : ""}`}
                        onClick={() => setContactData({ ...contactData, commission_mode: "amount" })}
                      >
                        Montant fixe
                      </button>
                    </div>

                    {contactData.commission_mode === "percentage" ? (
                      <label>
                        <span>Pourcentage</span>
                        <input
                          type="number"
                          step="0.1"
                          value={contactData.commission_percentage}
                          onChange={(e) => setContactData({ ...contactData, commission_percentage: e.target.value })}
                          placeholder="Ex: 3 (pour 3%)"
                        />
                      </label>
                    ) : (
                      <label>
                        <span>Montant ({project.currency})</span>
                        <input
                          type="number"
                          value={contactData.commission_amount}
                          onChange={(e) => setContactData({ ...contactData, commission_amount: e.target.value })}
                          placeholder="Ex: 15000"
                        />
                      </label>
                    )}

                    <label>
                      <span>Notes spécifiques à ce projet</span>
                      <textarea
                        rows="2"
                        value={contactData.project_notes}
                        onChange={(e) => setContactData({ ...contactData, project_notes: e.target.value })}
                        placeholder="Conditions négociées, modalités particulières..."
                      />
                    </label>
                  </>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={resetContactForm}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    {contactFormMode === "new" && "Créer et associer"}
                    {contactFormMode === "pick" && "Associer au projet"}
                    {contactFormMode === "edit" && "Enregistrer les modifications"}
                    {contactFormMode === "assoc" && "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION DÉLIAISON (retirer du projet) */}
        {contactUnlinkId && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setContactUnlinkId(null); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Retirer du projet ?</h2>
                <button className="close-btn" onClick={() => setContactUnlinkId(null)}>×</button>
              </div>
              <div className="modal-body-text">
                <p>Le contact sera retiré de ce projet, mais <strong>conservé dans votre carnet d'adresses global</strong>.</p>
                <p>Vous pourrez le ré-associer plus tard si besoin.</p>
              </div>
              <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setContactUnlinkId(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-primary" onClick={() => unlinkContact(contactUnlinkId)}>
                  Retirer du projet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION SUPPRESSION DU CARNET */}
        {contactDeleteId && (
          <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) e.currentTarget.dataset.downOnOverlay = "1"; }} onClick={(e) => { if (e.target === e.currentTarget && e.currentTarget.dataset.downOnOverlay === "1") setContactDeleteId(null); e.currentTarget.dataset.downOnOverlay = ""; }}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Supprimer du carnet ?</h2>
                <button className="close-btn" onClick={() => setContactDeleteId(null)}>×</button>
              </div>
              <div className="modal-body-text">
                <p>Cette action est <strong>irréversible</strong>.</p>
                <p>Le contact sera supprimé de votre carnet global, de <strong>tous les projets</strong> auxquels il est associé, ainsi que son historique d'échanges.</p>
              </div>
              <div className="modal-actions" style={{ padding: "1rem 1.75rem 1.75rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setContactDeleteId(null)}>
                  Annuler
                </button>
                <button type="button" className="btn-danger" onClick={() => deleteContact(contactDeleteId)}>
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

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
        .brand .logo { height: 42px; width: auto; display: block; }
        .header-actions { display: flex; align-items: center; gap: 1rem; }
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
          color: #687085; font-size: 0.85rem;
        }
        .breadcrumb a { color: #687085; text-decoration: none; transition: color 0.2s; }
        .breadcrumb a:hover { color: #D4AF37; }

        .breadcrumb-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .project-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-action {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          color: #0B1320;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.15s;
          cursor: pointer;
        }

        .btn-action:hover {
          border-color: #D4AF37;
          background: #FEFBF2;
        }

        .btn-action-danger {
          color: #DC2626;
        }

        .btn-action-danger:hover {
          border-color: #DC2626;
          background: #FEF2F2;
        }

        /* MODALS */
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

        .btn-primary {
          background: #D4AF37;
          color: #0B1320;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #E6C14E;
        }

        .btn-ghost {
          background: transparent;
          color: #687085;
          border: 1px solid #E6E9EF;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
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
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #B91C1C;
        }

        /* SECTION DIVIDER (dans modal) */
        .section-divider {
          margin-top: 1rem;
          padding-top: 1rem;
          padding-bottom: 0.25rem;
          border-top: 1px solid #EEF0F4;
        }
        .section-divider span {
          color: #0B1320;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        /* CARD STATUT FONCIER */
        .land-card {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #FFFFFF 0%, #FEFBF2 100%);
          border: 1px solid rgba(212, 175, 55, 0.25);
        }

        .land-timeline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
          padding: 0.5rem 0 0.25rem;
        }
        .land-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          color: #687085;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .step-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #D1D5DB;
          transition: all 0.2s;
        }
        .land-step.step-done .step-dot {
          background: #D4AF37;
          border-color: #D4AF37;
        }
        .land-step.step-done {
          color: #9a7f2a;
        }
        .land-step.step-current .step-dot {
          background: #FFFFFF;
          border-color: #D4AF37;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
          animation: pulse 2s infinite;
        }
        .land-step.step-current {
          color: #9a7f2a;
          font-weight: 600;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(212, 175, 55, 0.1); }
        }
        .land-line {
          flex: 1;
          height: 2px;
          background: #E5E7EB;
          margin: 0 0.25rem;
          margin-bottom: 1rem;
          transition: background 0.3s;
        }
        .land-line.line-done {
          background: #D4AF37;
        }

        .land-notes {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.15);
        }
        .land-notes-label {
          color: #687085;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .land-notes p {
          color: #0B1320;
          font-size: 0.9rem;
          margin-top: 0.35rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        /* ============ SECTION CONTACTS ============ */
        .contacts-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .contacts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .contacts-header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .info-banner {
          margin: 0 1.75rem 0.25rem;
          padding: 0.75rem 1rem;
          background: #FEFBF2;
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 10px;
          font-size: 0.85rem;
          color: #687085;
          line-height: 1.5;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .info-banner strong {
          color: #0B1320;
        }

        .link-btn {
          background: transparent;
          border: none;
          color: #9a7f2a;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0.35rem 0.5rem;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .link-btn:hover {
          color: #D4AF37;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #0B1320;
          margin-bottom: 0.25rem;
        }

        .section-subtitle {
          color: #687085;
          font-size: 0.9rem;
        }

        /* État vide */
        .empty-state {
          background: #FFFFFF;
          border: 1px dashed #E6E9EF;
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
        }
        .empty-icon-big {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .empty-state h4 {
          color: #0B1320;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        .empty-state p {
          color: #687085;
          margin-bottom: 1.5rem;
          max-width: 380px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-outline {
          background: transparent;
          border: 1.5px solid #D4AF37;
          color: #9a7f2a;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          background: rgba(212, 175, 55, 0.08);
          color: #9a7f2a;
        }

        /* Grille de cards contacts */
        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
        }

        .contact-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          padding: 1.25rem;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
        }
        .contact-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 4px 12px rgba(11, 19, 32, 0.05);
        }

        .contact-top {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .contact-avatar {
          width: 44px;
          height: 44px;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .contact-info {
          flex: 1;
          min-width: 0;
        }

        .contact-type-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9a7f2a;
          background: rgba(212, 175, 55, 0.12);
          padding: 0.2rem 0.55rem;
          border-radius: 5px;
          margin-bottom: 0.35rem;
        }

        .contact-name {
          font-size: 1rem;
          font-weight: 600;
          color: #0B1320;
          margin-bottom: 0.15rem;
          word-break: break-word;
        }

        .contact-role {
          font-size: 0.82rem;
          color: #687085;
          line-height: 1.35;
        }

        .contact-menu-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid #F3F4F6;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.75rem;
          font-size: 0.85rem;
        }

        .detail-label {
          color: #687085;
          font-weight: 500;
          flex-shrink: 0;
        }

        .detail-value {
          color: #0B1320;
          text-align: right;
          word-break: break-word;
        }

        .detail-link {
          color: #9a7f2a;
          text-decoration: none;
        }
        .detail-link:hover {
          text-decoration: underline;
        }

        .whatsapp-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #25D366;
        }
        .whatsapp-link:hover {
          color: #128C7E;
          text-decoration: underline;
        }
        .wa-icon {
          font-size: 0.9rem;
        }

        /* ============ SECTION BUDGET & COÛTS ============ */
        .budget-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .budget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .budget-header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Barre de progression vs budget cible */
        .budget-progress-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .progress-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .progress-right { text-align: right; }
        .progress-label {
          display: block;
          font-size: 0.7rem;
          color: #687085;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
          margin-bottom: 0.2rem;
        }
        .progress-target {
          display: block;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0B1320;
        }
        .progress-used {
          display: block;
          font-size: 1.1rem;
          font-weight: 600;
          color: #D4AF37;
        }
        .progress-used.over { color: #DC2626; }
        .progress-bar {
          width: 100%;
          height: 10px;
          background: #F3F4F6;
          border-radius: 5px;
          overflow: hidden;
          position: relative;
          display: flex;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4AF37 0%, #E6C14E 100%);
          border-radius: 5px;
          transition: width 0.4s ease;
        }
        .progress-fill.over {
          background: linear-gradient(90deg, #D4AF37 0%, #DC2626 100%);
        }
        .progress-over-indicator {
          height: 100%;
          background: repeating-linear-gradient(
            45deg,
            #DC2626,
            #DC2626 6px,
            #B91C1C 6px,
            #B91C1C 12px
          );
        }
        .progress-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #687085;
        }
        .progress-bottom strong { color: #0B1320; }
        .over-text strong { color: #DC2626; }

        /* Layout principal : donut à gauche, liste à droite */
        .budget-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1.5rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .budget-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Donut */
        .donut-card {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          padding: 1.5rem;
          position: sticky;
          top: 1.5rem;
        }
        .donut-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0B1320;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }
        .donut-wrapper {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 1.25rem;
        }
        .donut-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .donut-center-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0B1320;
        }
        .donut-center-label {
          font-size: 0.75rem;
          color: #687085;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .donut-legend {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .donut-legend li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .legend-label {
          flex: 1;
          color: #0B1320;
        }
        .legend-value {
          color: #687085;
          font-weight: 500;
        }

        /* Liste des coûts */
        .costs-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cost-category {
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 14px;
          /* overflow: hidden retiré pour ne pas couper le menu dropdown */
        }
        .cat-header {
          display: flex;
          justify-content: space-between;
          /* arrondi du haut uniquement */
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
          align-items: center;
          padding: 0.85rem 1.25rem;
          background: #F7F8FA;
          border-bottom: 1px solid #EEF0F4;
        }
        .cat-header h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0B1320;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0;
        }
        .cat-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .cat-total {
          font-weight: 600;
          color: #0B1320;
        }
        .cost-items {
          display: flex;
          flex-direction: column;
        }
        .cost-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid #F3F4F6;
        }
        .cost-item:last-child {
          border-bottom: none;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
        }
        .cost-item:hover { background: #FAFBFC; }

        .cost-main {
          flex: 1;
          min-width: 0;
        }
        .cost-label-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.2rem;
        }
        .cost-label {
          font-weight: 500;
          color: #0B1320;
          font-size: 0.95rem;
        }
        .cost-status {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cost-status.status-estime {
          background: rgba(107, 114, 128, 0.12);
          color: #4B5563;
        }
        .cost-status.status-engage {
          background: rgba(212, 175, 55, 0.15);
          color: #9a7f2a;
        }
        .cost-status.status-paye {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }
        .cost-meta {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          font-size: 0.78rem;
          color: #687085;
        }
        .cost-tag {
          background: #F3F4F6;
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          font-weight: 500;
        }
        .cost-contact {
          color: #9a7f2a;
          font-weight: 500;
        }
        .cost-date {
          color: #687085;
        }

        .cost-right {
          text-align: right;
          flex-shrink: 0;
        }
        .cost-amount {
          display: block;
          font-weight: 600;
          color: #0B1320;
          font-size: 0.95rem;
        }
        .cost-amount-eur {
          display: block;
          font-size: 0.75rem;
          color: #687085;
        }
        .progress-eur {
          color: #687085;
          font-size: 0.85rem;
          font-weight: 400;
          margin-left: 0.25rem;
        }

        .cost-menu-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        /* Preview calcul */
        .calc-preview {
          background: #FEFBF2;
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #687085;
        }
        .calc-preview strong {
          color: #9a7f2a;
          font-size: 1rem;
        }

        /* Catalogue */
        .catalog-list {
          padding: 1.25rem 1.75rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .catalog-category {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .catalog-cat-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0B1320;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }
        .catalog-items {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .catalog-item {
          background: #F7F8FA;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          width: 100%;
        }
        .catalog-item:hover {
          background: #FEFBF2;
          border-color: rgba(212, 175, 55, 0.3);
        }
        .catalog-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .catalog-text {
          flex: 1;
          min-width: 0;
        }
        .catalog-label {
          font-weight: 500;
          color: #0B1320;
          font-size: 0.92rem;
          margin-bottom: 0.1rem;
        }
        .catalog-description {
          font-size: 0.8rem;
          color: #687085;
        }
        .catalog-hint {
          font-size: 0.75rem;
          color: #9a7f2a;
          margin-top: 0.2rem;
        }
        .catalog-pct {
          background: rgba(212, 175, 55, 0.15);
          color: #9a7f2a;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 0.25rem 0.55rem;
          border-radius: 6px;
          flex-shrink: 0;
        }

        /* ============ MODE SPLIT (Prix d'achat Maroc) ============ */
        .mode-toggle {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }
        @media (max-width: 640px) {
          .mode-toggle {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .mode-toggle .toggle-btn {
          font-size: 0.78rem;
          padding: 0.6rem 0.4rem;
          text-align: center;
        }

        .split-banner {
          background: #FEFBF2;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #687085;
          line-height: 1.5;
        }
        .split-banner strong {
          color: #9a7f2a;
        }

        .field-hint {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #687085;
          font-style: italic;
        }

        .split-preview {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .split-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }
        .split-line.cash-line {
          color: #15803d;
        }
        .split-line.split-total {
          padding-top: 0.5rem;
          border-top: 1px dashed rgba(212, 175, 55, 0.4);
          margin-top: 0.25rem;
        }
        .split-line.split-total strong {
          color: #9a7f2a;
          font-size: 1.05rem;
        }

        /* Sous-lignes dans la liste (prix d'achat en mode split) */
        .split-sublines {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #FAFBFC;
          border-radius: 6px;
          border-left: 2px solid #D4AF37;
        }
        .subline {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #687085;
        }
        .subline-cash {
          color: #15803d;
        }
        .subline-label {
          flex: 1;
        }
        .subline-value {
          font-weight: 500;
        }

        /* Tag CASH */
        .cash-tag {
          display: inline-block;
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        /* Sélecteur de base officielle / réelle */
        .base-ref-selector {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          background: #FEFBF2;
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 10px;
          padding: 0.75rem 1rem;
        }
        .base-ref-label {
          font-size: 0.82rem;
          color: #687085;
          font-weight: 500;
        }
        .base-ref-option {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: #0B1320;
          cursor: pointer;
        }
        .base-ref-option input[type="radio"] {
          margin: 0;
          cursor: pointer;
          accent-color: #D4AF37;
        }
        .base-ref-option strong {
          color: #9a7f2a;
        }
        .base-ref-indicator {
          color: #9a7f2a;
          font-weight: 500;
        }

        .detail-highlight {
          color: #D4AF37;
          font-weight: 600;
          background: rgba(212, 175, 55, 0.1);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }

        .detail-mono {
          font-family: "SF Mono", Menlo, monospace;
          font-size: 0.78rem;
        }

        .contact-notes {
          padding-top: 0.5rem;
          border-top: 1px dashed #F3F4F6;
          margin-top: 0.25rem;
        }
        .contact-notes p {
          font-size: 0.82rem;
          color: #687085;
          font-style: italic;
          line-height: 1.45;
          white-space: pre-wrap;
        }

        /* Toggle historique des échanges */
        .toggle-interactions {
          margin-top: 0.5rem;
          background: transparent;
          border: none;
          color: #687085;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 0.5rem 0;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-top: 1px solid #F3F4F6;
          transition: color 0.15s;
        }
        .toggle-interactions:hover {
          color: #0B1320;
        }
        .interactions-count {
          background: #D4AF37;
          color: #0B1320;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .interactions-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .interactions-header {
          display: flex;
          justify-content: flex-end;
        }

        .btn-mini {
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        .interaction-form {
          background: #F7F8FA;
          border: 1px solid #EEF0F4;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .interaction-form .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .interaction-form label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .interaction-form label span {
          font-size: 0.8rem;
          color: #0B1320;
          font-weight: 500;
        }
        .interaction-form input,
        .interaction-form select,
        .interaction-form textarea {
          background: #FFFFFF;
          border: 1px solid #E6E9EF;
          padding: 0.5rem 0.75rem;
          border-radius: 7px;
          font-size: 0.85rem;
          color: #0B1320;
          font-family: inherit;
        }
        .interaction-form input:focus,
        .interaction-form select:focus,
        .interaction-form textarea:focus {
          outline: none;
          border-color: #D4AF37;
        }

        .interaction-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .empty-interactions {
          color: #687085;
          font-size: 0.85rem;
          font-style: italic;
          text-align: center;
          padding: 1rem;
        }

        .interactions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .interaction-item {
          background: #F7F8FA;
          border-left: 3px solid #D4AF37;
          border-radius: 6px;
          padding: 0.6rem 0.85rem;
          position: relative;
        }

        .interaction-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .interaction-type {
          font-size: 0.78rem;
          font-weight: 600;
          color: #9a7f2a;
        }

        .interaction-date {
          font-size: 0.75rem;
          color: #687085;
          flex: 1;
        }

        .interaction-delete {
          background: transparent;
          border: none;
          color: #687085;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .interaction-delete:hover {
          background: #FEF2F2;
          color: #DC2626;
        }

        .interaction-subject {
          font-size: 0.85rem;
          color: #0B1320;
          font-weight: 500;
          margin-bottom: 0.15rem;
        }
        .interaction-notes {
          font-size: 0.8rem;
          color: #687085;
          line-height: 1.45;
          white-space: pre-wrap;
        }

        /* Menu dropdown et trigger (réutilisation des styles) */
        .menu-trigger {
          background: transparent;
          border: none;
          color: #687085;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
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
          font-size: 0.88rem;
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

        /* Toggle commission % vs montant */
        .commission-toggle {
          display: flex;
          gap: 0.5rem;
          background: #F7F8FA;
          padding: 0.35rem;
          border-radius: 10px;
          border: 1px solid #EEF0F4;
        }
        .toggle-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.55rem 0.75rem;
          border-radius: 7px;
          font-size: 0.82rem;
          font-weight: 500;
          color: #687085;
          cursor: pointer;
          transition: all 0.15s;
        }
        .toggle-btn:hover {
          color: #0B1320;
        }
        .toggle-active {
          background: #FFFFFF;
          color: #0B1320;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(11, 19, 32, 0.08);
        }

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
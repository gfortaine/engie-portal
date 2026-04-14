import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, tool, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { appendEvent, createSession, getSession } from '../lib/vertex-sessions.js';

// ── Dynamic mock data generators ────────────────────────────────────
// Data is date-relative and uses seeded randomness so it feels fresh
// but stays consistent within the same day.

/** Simple seeded pseudo-random based on day of year */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 1000 + Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
}

/** Vary a base value by ±range% using seeded random */
function vary(base: number, rangePct: number, rand: () => number): number {
  const factor = 1 + (rand() * 2 - 1) * (rangePct / 100);
  return Math.round(base * factor * 100) / 100;
}

/** Get French month name */
function frMonth(m: number): string {
  return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m];
}

/** Seasonal multiplier for energy consumption (0=Jan..11=Dec) */
function seasonalFactor(month: number, energyType: string): number {
  // Heating-dominant: peaks in winter
  const heatingCurve = [1.35, 1.25, 1.05, 0.80, 0.60, 0.50, 0.45, 0.50, 0.65, 0.85, 1.10, 1.30];
  // Electricity: winter heating + summer AC
  const elecCurve =    [1.25, 1.15, 0.95, 0.80, 0.75, 0.85, 0.95, 0.90, 0.75, 0.80, 1.00, 1.20];
  if (energyType === 'gas') return heatingCurve[month];
  return elecCurve[month];
}

const mockContracts = [
  { id: 'ctr_001', reference: 'ENGIE-ELEC-2024-78542', type: 'electricity', status: 'active', address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 87.50, meterNumber: 'PDL-14789632541' },
  { id: 'ctr_002', reference: 'ENGIE-GAZ-2024-32187', type: 'gas', status: 'active', address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 62.00, meterNumber: 'PCE-98765432100' },
  { id: 'ctr_003', reference: 'ENGIE-SOLAR-2025-10245', type: 'solar', status: 'pending', address: '42 Avenue des Champs-Élysées, 75008 Paris', startDate: '2025-06-01', monthlyAmount: 35.00, meterNumber: 'PDL-55512345678' },
  { id: 'ctr_004', reference: 'ENGIE-ELEC-2023-45678', type: 'electricity', status: 'terminated', address: '8 Boulevard Haussmann, 75009 Paris', startDate: '2023-03-01', endDate: '2025-02-28', monthlyAmount: 0, meterNumber: 'PDL-33345678901' },
];

function generateInvoices() {
  const now = new Date();
  const rand = seededRandom(getDaySeed() + 42);
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const invoices: Array<{
    id: string; contractId: string; reference: string; period: string;
    issueDate: string; dueDate: string; amount: number; status: string;
    breakdown: { consumption: number; subscription: number; taxes: number };
  }> = [];

  const contracts = [
    { id: 'ctr_001', baseConso: 75, subscription: 12.50, taxRate: 0.12 },
    { id: 'ctr_002', baseConso: 50, subscription: 11.00, taxRate: 0.13 },
  ];

  for (const [ci, ctr] of contracts.entries()) {
    for (const [mi, m] of months.entries()) {
      const season = seasonalFactor(m.month, ci === 0 ? 'electricity' : 'gas');
      const consumption = vary(ctr.baseConso * season, 12, rand);
      const taxes = Math.round(consumption * ctr.taxRate * 100) / 100;
      const amount = Math.round((consumption + ctr.subscription + taxes) * 100) / 100;
      const issueDate = new Date(m.year, m.month + 1, 1);
      const dueDate = new Date(m.year, m.month + 1, 15);

      let status = 'paid';
      if (mi === 0) status = 'pending';
      else if (mi === 4 && rand() > 0.5) status = 'overdue';

      invoices.push({
        id: `inv_${String(ci * 100 + mi + 1).padStart(3, '0')}`,
        contractId: ctr.id,
        reference: `FACT-${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(ci + 1).padStart(3, '0')}`,
        period: `${frMonth(m.month)} ${m.year}`,
        issueDate: issueDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        amount,
        status,
        breakdown: { consumption, subscription: ctr.subscription, taxes },
      });
    }
  }
  return invoices;
}

function generateAlerts() {
  const now = new Date();
  const rand = seededRandom(getDaySeed() + 99);
  const invoices = generateInvoices();

  // Pool of possible alerts — pick a dynamic subset
  const alertPool = [
    { type: 'overconsumption', severity: 'warning', contractRef: 'ENGIE-ELEC-2024-78542', template: `Consommation électrique supérieure de ${Math.round(15 + rand() * 20)}% par rapport au mois dernier`, daysAgo: Math.floor(rand() * 5) },
    { type: 'payment_due', severity: 'danger', contractRef: 'ENGIE-ELEC-2024-78542', template: '', daysAgo: Math.floor(rand() * 10 + 2) },
    { type: 'rate_change', severity: 'info', contractRef: 'ENGIE-GAZ-2024-32187', template: 'Nouveau tarif réglementé gaz applicable à partir du 1er du mois prochain', daysAgo: Math.floor(rand() * 8) },
    { type: 'eco_tip', severity: 'success', contractRef: 'ENGIE-SOLAR-2025-10245', template: `Votre installation solaire a produit ${Math.round(10 + rand() * 25)}% de plus que prévu ce mois-ci`, daysAgo: Math.floor(rand() * 3) },
    { type: 'meter_reading', severity: 'info', contractRef: 'ENGIE-ELEC-2024-78542', template: 'Relevé de compteur prévu dans les 5 prochains jours', daysAgo: 0 },
    { type: 'contract_renewal', severity: 'warning', contractRef: 'ENGIE-GAZ-2024-32187', template: 'Votre contrat gaz arrive à échéance dans 45 jours', daysAgo: Math.floor(rand() * 7 + 1) },
    { type: 'consumption_goal', severity: 'success', contractRef: 'ENGIE-ELEC-2024-78542', template: `Objectif consommation atteint : -${Math.round(5 + rand() * 12)}% ce mois-ci 🎉`, daysAgo: Math.floor(rand() * 2) },
    { type: 'peak_warning', severity: 'warning', contractRef: 'ENGIE-ELEC-2024-78542', template: 'Pic de consommation détecté hier entre 18h et 21h', daysAgo: 1 },
    { type: 'payment_confirmed', severity: 'success', contractRef: 'ENGIE-GAZ-2024-32187', template: 'Paiement de votre facture gaz confirmé', daysAgo: Math.floor(rand() * 6 + 1) },
    { type: 'eco_bonus', severity: 'info', contractRef: 'ENGIE-SOLAR-2025-10245', template: 'Prime énergie : vous êtes éligible à une aide pour l\'isolation thermique', daysAgo: Math.floor(rand() * 4) },
  ];

  // Fill in payment_due with dynamic invoice reference
  const overdueInv = invoices.find(i => i.status === 'overdue');
  if (overdueInv) {
    const pdAlert = alertPool.find(a => a.type === 'payment_due');
    if (pdAlert) pdAlert.template = `Facture ${overdueInv.reference} en retard de paiement (${overdueInv.amount.toFixed(2).replace('.', ',')}€)`;
  } else {
    // No overdue invoice → remove payment_due alert
    const idx = alertPool.findIndex(a => a.type === 'payment_due');
    if (idx >= 0) alertPool.splice(idx, 1);
  }

  // Pick 3-5 alerts based on day seed
  const count = 3 + Math.floor(rand() * 3);
  // Shuffle using Fisher-Yates
  for (let i = alertPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [alertPool[i], alertPool[j]] = [alertPool[j], alertPool[i]];
  }
  const selected = alertPool.slice(0, count);

  return selected.map((a, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - a.daysAgo);
    return {
      id: `alert_${String(i + 1).padStart(3, '0')}`,
      type: a.type,
      severity: a.severity,
      contractRef: a.contractRef,
      message: a.template,
      date: date.toISOString().split('T')[0],
    };
  });
}

function generateConsumptionStats(contractId: string) {
  const now = new Date();
  const rand = seededRandom(getDaySeed() + 77);
  const contract = mockContracts.find(c => c.id === contractId);
  const isElectric = contract?.type === 'electricity' || contract?.type === 'solar';
  const energyType = contract?.type ?? 'electricity';
  const unit = isElectric ? 'kWh' : 'm³';
  const baseMonthly = isElectric ? 320 : 120;

  const curMonth = now.getMonth();
  const prevMonth = (curMonth - 1 + 12) % 12;

  const curSeason = seasonalFactor(curMonth, energyType);
  const prevSeason = seasonalFactor(prevMonth, energyType);

  const curTotal = Math.round(vary(baseMonthly * curSeason, 10, rand));
  const prevTotal = Math.round(vary(baseMonthly * prevSeason, 10, rand));
  const curDays = now.getDate();
  const prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

  // Year-over-year with slight trend
  const ytdMonths = curMonth + 1;
  let curYear = 0, prevYear = 0;
  for (let i = 0; i < ytdMonths; i++) {
    const sf = seasonalFactor(i, energyType);
    curYear += Math.round(vary(baseMonthly * sf, 8, rand));
    prevYear += Math.round(vary(baseMonthly * sf * 1.04, 8, rand)); // last year was ~4% higher
  }
  const changePercent = Math.round(((curYear - prevYear) / prevYear) * 1000) / 10;

  // Monthly chart data — last 6 months
  const monthlyData: Array<{ month: string; value: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const m = (curMonth - i + 12) % 12;
    const sf = seasonalFactor(m, energyType);
    monthlyData.push({
      month: frMonth(m).slice(0, 3),
      value: Math.round(vary(baseMonthly * sf, 10, rand)),
    });
  }

  const trend = curTotal < prevTotal ? 'decreasing' : curTotal > prevTotal * 1.05 ? 'increasing' : 'stable';

  return {
    contractRef: contract?.reference ?? contractId,
    type: energyType,
    unit,
    currentMonth: { period: `${frMonth(curMonth)} ${now.getFullYear()}`, total: curTotal, dailyAvg: Math.round((curTotal / curDays) * 10) / 10 },
    previousMonth: { period: `${frMonth(prevMonth)} ${now.getFullYear()}`, total: prevTotal, dailyAvg: Math.round((prevTotal / prevDays) * 10) / 10 },
    yearOverYear: { currentYear: curYear, previousYear: prevYear, changePercent },
    trend: trend as 'decreasing' | 'increasing' | 'stable',
    peakHours: isElectric ? { percentage: Math.round(30 + rand() * 15), recommendation: 'Décaler les cycles de lave-linge en heures creuses' } : null,
    monthlyData,
  };
}

// ── System Prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant IA du portail client ENGIE. Tu aides les clients à comprendre leur consommation d'énergie, leurs contrats et leurs factures.

Règles:
- Réponds toujours en français sauf si le client parle une autre langue
- Sois concis, professionnel et bienveillant
- Utilise les outils disponibles pour afficher des données visuelles quand c'est pertinent
- Ne jamais inventer de données — utilise uniquement les résultats des outils
- Pour les questions hors périmètre énergie, redirige poliment vers le service client

Contexte client:
- Nom: Marie Dupont
- 4 contrats actifs (électricité, gaz, solaire)
- Adresses: Paris 2e et Paris 8e
- Cliente depuis janvier 2024

Capacités:
- explainBill: Détailler une facture ligne par ligne
- analyzeConsumption: Analyser la consommation d'un compteur
- compareContracts: Comparer des contrats côte à côte
- findContract: Rechercher un contrat par critères
- getAlerts: Afficher les alertes et notifications
- suggestSavings: Proposer des économies d'énergie personnalisées
- renderDashboard: Générer un tableau de bord interactif (A2UI) avec des composants Fluid DS

Après avoir utilisé un outil, résume toujours les données clés sous forme de **tableau markdown** (| colonne1 | colonne2 |) pour une lecture rapide, suivi d'un bref commentaire. Par exemple pour suggestSavings:
| Recommandation | Économie | Difficulté |
|---|---|---|
| Heures creuses | -14.20 €/mois | 🟢 Facile |

Pour renderDashboard, tu génères un tableau de bord A2UI avec ces composants disponibles:
- FluidText: { text, variant: h1|h2|h3|h4|h5|body|caption }
- FluidCard: { title?, children: [...ids] }
- FluidRow: { children: [...ids], gap? }
- FluidColumn: { children: [...ids], gap? }
- FluidBadge: { label, variant: neutral|success|warning|danger|information|discovery }
- FluidTag: { label, variant: brand|grey|blue|teal|orange|red|green }
- FluidProgress: { value (0-100), max?, label? }
- FluidAlert: { message, severity: information|success|warning|error }
- FluidButton: { label, variant: primary|secondary|subtle }
- FluidIcon: { name (Material icon name) }
- FluidDivider: {}

Format A2UI v0.9: un objet { messages: [...] } avec:
1. createSurface: { surfaceId, catalogId: "https://engie.design/fluid/a2ui/1.0" }
2. updateComponents: { surfaceId, components: [{ id, component: "FluidText", ...props }] }
3. updateDataModel: { surfaceId, path, value } (optionnel)
Le composant racine DOIT avoir id "root".`;

// ── Energy Domain Tools ────────────────────────────────────────────
const tools = {
  explainBill: tool({
    description: "Explique en détail une facture d'énergie avec la décomposition des coûts (consommation, abonnement, taxes). Utilise cet outil quand le client pose une question sur une facture.",
    inputSchema: z.object({
      invoiceRef: z.string().describe("Référence de la facture (ex: FACT-2026-03-001) ou 'latest' pour la dernière"),
    }),
    execute: async ({ invoiceRef }) => {
      const invoices = generateInvoices();
      const invoice = invoiceRef === 'latest'
        ? invoices[0]
        : invoices.find(i => i.reference === invoiceRef) ?? invoices[0];
      const contract = mockContracts.find(c => c.id === invoice!.contractId);
      return {
        ...invoice,
        contractRef: contract?.reference,
        contractType: contract?.type,
        address: contract?.address,
        tariff: contract?.type === 'electricity' ? 'Tarif Bleu Réglementé' : 'Prix Repère Gaz',
        pricePerUnit: contract?.type === 'electricity' ? '0.2516 €/kWh' : '0.1284 €/kWh',
      };
    },
  }),

  analyzeConsumption: tool({
    description: "Analyse la consommation d'énergie pour un contrat donné. Montre les tendances, comparaisons et recommandations. Utilise cet outil pour les questions sur la consommation.",
    inputSchema: z.object({
      contractId: z.string().optional().describe("ID du contrat (ctr_001, ctr_002, etc.) — si non fourni, utilise le contrat principal"),
    }),
    execute: async ({ contractId }) => {
      return generateConsumptionStats(contractId ?? 'ctr_001');
    },
  }),

  compareContracts: tool({
    description: "Compare deux ou plusieurs contrats côte à côte — type, tarif, consommation, coût. Utilise cet outil quand le client veut comparer ses contrats.",
    inputSchema: z.object({
      contractIds: z.array(z.string()).min(2).describe("Liste des IDs de contrats à comparer"),
    }),
    execute: async ({ contractIds }) => {
      const invoices = generateInvoices();
      return contractIds
        .map(id => {
          const contract = mockContracts.find(c => c.id === id);
          if (!contract) return null;
          const ctInvoices = invoices.filter(i => i.contractId === id);
          const totalSpent = ctInvoices.reduce((sum, i) => sum + i.amount, 0);
          return { ...contract, invoiceCount: ctInvoices.length, totalSpent: Math.round(totalSpent * 100) / 100 };
        })
        .filter(Boolean);
    },
  }),

  findContract: tool({
    description: "Recherche un contrat par critères (type d'énergie, adresse, statut, référence). Utilise cet outil quand le client cherche un contrat spécifique.",
    inputSchema: z.object({
      query: z.string().describe("Terme de recherche (type d'énergie, adresse, référence, etc.)"),
    }),
    execute: async ({ query }) => {
      const q = query.toLowerCase();
      return mockContracts.filter(c =>
        c.type.includes(q) ||
        c.reference.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.status.includes(q)
      );
    },
  }),

  getAlerts: tool({
    description: "Récupère les alertes et notifications actives du client (surconsommation, paiements en retard, changements de tarif, conseils écologiques).",
    inputSchema: z.object({
      severity: z.enum(['all', 'danger', 'warning', 'info', 'success']).optional().describe("Filtrer par niveau de sévérité"),
    }),
    execute: async ({ severity }) => {
      const alerts = generateAlerts();
      if (severity && severity !== 'all') {
        return alerts.filter(a => a.severity === severity);
      }
      return alerts;
    },
  }),

  suggestSavings: tool({
    description: "Propose des recommandations d'économies d'énergie personnalisées basées sur les habitudes de consommation du client.",
    needsApproval: true,
    inputSchema: z.object({
      contractId: z.string().optional().describe("ID du contrat pour des recommandations ciblées"),
    }),
    execute: async ({ contractId }) => {
      const rand = seededRandom(getDaySeed() + 55);
      const contract = mockContracts.find(c => c.id === (contractId ?? 'ctr_001'));
      const allSavings = [
        { id: 'sav_001', title: 'Heures creuses', description: 'Programmez vos appareils énergivores (lave-linge, lave-vaisselle) entre 22h et 6h', potentialSaving: '15%', impactEuros: vary(14.20, 15, rand), difficulty: 'easy', category: 'comportement' },
        { id: 'sav_002', title: 'Thermostat intelligent', description: 'Installez un thermostat connecté pour optimiser le chauffage selon votre présence', potentialSaving: '20%', impactEuros: vary(18.60, 15, rand), difficulty: 'medium', category: 'équipement' },
        { id: 'sav_003', title: 'Veille des appareils', description: 'Utilisez des multiprises à interrupteur pour couper la veille des appareils électroniques', potentialSaving: '10%', impactEuros: vary(9.30, 15, rand), difficulty: 'easy', category: 'comportement' },
        { id: 'sav_004', title: 'Isolation fenêtres', description: 'Vérifiez les joints de vos fenêtres — des joints usés peuvent augmenter votre facture de chauffage de 25%', potentialSaving: '25%', impactEuros: vary(23.25, 15, rand), difficulty: 'hard', category: 'travaux' },
        { id: 'sav_005', title: 'Éclairage LED', description: 'Remplacez vos ampoules classiques par des LED — jusqu\'à 80% d\'économie sur l\'éclairage', potentialSaving: '8%', impactEuros: vary(7.50, 15, rand), difficulty: 'easy', category: 'équipement' },
        { id: 'sav_006', title: 'Douche économique', description: 'Installez un pommeau de douche économique pour réduire la consommation d\'eau chaude', potentialSaving: '12%', impactEuros: vary(11.00, 15, rand), difficulty: 'easy', category: 'équipement' },
      ];
      // Pick 3-5 savings
      const count = 3 + Math.floor(rand() * 3);
      for (let i = allSavings.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [allSavings[i], allSavings[j]] = [allSavings[j], allSavings[i]];
      }
      const savings = allSavings.slice(0, count);
      return {
        contractRef: contract?.reference,
        energyType: contract?.type,
        totalPotentialSaving: Math.round(savings.reduce((sum, s) => sum + s.impactEuros, 0) * 100) / 100,
        recommendations: savings,
      };
    },
  }),

  renderDashboard: tool({
    description: "Génère un tableau de bord interactif avec des composants Fluid Design System via le protocole A2UI v0.9. Utilise cet outil pour présenter des données structurées sous forme de dashboard: résumés, KPI, listes, alertes. Idéal pour les demandes de type 'montre-moi un résumé', 'affiche mon tableau de bord', 'fais un récapitulatif'.",
    inputSchema: z.object({
      type: z.string().describe("Type de dashboard: 'summary', 'contracts', 'alerts', 'consumption', 'custom'"),
      context: z.string().optional().describe("Contexte ou instruction supplémentaire pour personnaliser le dashboard"),
    }),
    execute: async ({ type, context: ctx }) => {
      // Build A2UI messages based on dashboard type
      const surfaceId = `dashboard-${type}`;
      const catalogId = 'https://engie.design/fluid/a2ui/1.0';
      const messages: Record<string, unknown>[] = [
        { version: 'v0.9', createSurface: { surfaceId, catalogId } },
      ];

      if (type === 'summary' || type === 'custom') {
        const contracts = mockContracts;
        const active = contracts.filter(c => c.status === 'active');
        const pending = contracts.filter(c => c.status === 'pending');
        const totalMonthly = active.reduce((s, c) => s + c.monthlyAmount, 0);
        const alerts = generateAlerts();
        const invoices = generateInvoices();
        const unpaid = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
        const lastPaid = invoices.filter(i => i.status === 'paid').slice(0, 2);
        const elecStats = generateConsumptionStats('ctr_001');
        const gasStats = generateConsumptionStats('ctr_002');
        const elecChange = elecStats.yearOverYear.changePercent;
        const gasChange = gasStats.yearOverYear.changePercent;

        // Build a comprehensive dashboard
        const components: Record<string, unknown>[] = [
          // Root layout
          { id: 'root', component: 'FluidColumn', children: [
            'title',
            'kpi-row',
            'divider-1',
            'conso-section',
            'divider-2',
            'contracts-section',
            'divider-3',
            'invoices-section',
            ...(alerts.length > 0 ? ['divider-4', 'alerts-section'] : []),
          ] },

          // Title
          { id: 'title', component: 'FluidText', text: '📊 Tableau de bord énergie', variant: 'h2' },

          // ── KPI Row ──
          { id: 'kpi-row', component: 'FluidRow', children: ['kpi-contracts', 'kpi-monthly', 'kpi-invoices'], gap: '8px' },

          { id: 'kpi-contracts', component: 'FluidCard', title: 'Contrats actifs', children: ['kpi-contracts-row'] },
          { id: 'kpi-contracts-row', component: 'FluidRow', children: ['kpi-contracts-val', 'kpi-contracts-badge'], gap: '8px' },
          { id: 'kpi-contracts-val', component: 'FluidText', text: `${active.length}/${contracts.length}`, variant: 'h1' },
          { id: 'kpi-contracts-badge', component: 'FluidBadge', label: pending.length > 0 ? `${pending.length} en attente` : 'Tous actifs', variant: pending.length > 0 ? 'warning' : 'success' },

          { id: 'kpi-monthly', component: 'FluidCard', title: 'Mensualité totale', children: ['kpi-monthly-val', 'kpi-monthly-detail'] },
          { id: 'kpi-monthly-val', component: 'FluidText', text: `${totalMonthly.toFixed(2)} €`, variant: 'h1' },
          { id: 'kpi-monthly-detail', component: 'FluidText', text: `⚡ ${active.find(c => c.type === 'electricity')?.monthlyAmount.toFixed(2) ?? '0'} € + 🔥 ${active.find(c => c.type === 'gas')?.monthlyAmount.toFixed(2) ?? '0'} €`, variant: 'caption' },

          { id: 'kpi-invoices', component: 'FluidCard', title: 'Factures', children: ['kpi-invoices-row'] },
          { id: 'kpi-invoices-row', component: 'FluidColumn', children: ['kpi-invoices-unpaid', 'kpi-invoices-paid'] },
          { id: 'kpi-invoices-unpaid', component: 'FluidRow', children: ['kpi-inv-unpaid-badge', 'kpi-inv-unpaid-text'], gap: '6px' },
          { id: 'kpi-inv-unpaid-badge', component: 'FluidBadge', label: `${unpaid.length}`, variant: unpaid.some(i => i.status === 'overdue') ? 'danger' : 'warning' },
          { id: 'kpi-inv-unpaid-text', component: 'FluidText', text: unpaid.some(i => i.status === 'overdue') ? 'en retard' : 'en attente', variant: 'caption' },
          { id: 'kpi-invoices-paid', component: 'FluidText', text: `${invoices.filter(i => i.status === 'paid').length} payées`, variant: 'caption' },

          { id: 'divider-1', component: 'FluidDivider' },

          // ── Consumption Section ──
          { id: 'conso-section', component: 'FluidCard', title: '⚡ Consommation ce mois', children: ['conso-elec', 'conso-gas'] },

          { id: 'conso-elec', component: 'FluidColumn', children: ['conso-elec-header', 'conso-elec-bar'] },
          { id: 'conso-elec-header', component: 'FluidRow', children: ['conso-elec-icon', 'conso-elec-trend'], gap: '6px' },
          { id: 'conso-elec-icon', component: 'FluidText', text: `Électricité — ${elecStats.currentMonth.total} ${elecStats.unit}`, variant: 'body' },
          { id: 'conso-elec-trend', component: 'FluidBadge',
            label: `${elecChange >= 0 ? '↑' : '↓'} ${Math.abs(elecChange)}%`,
            variant: elecChange > 10 ? 'danger' : elecChange > 0 ? 'warning' : 'success',
          },
          { id: 'conso-elec-bar', component: 'FluidProgress', value: Math.min(Math.round((elecStats.currentMonth.total / (elecStats.previousMonth.total || 1)) * 100), 100), max: 100, label: 'vs. mois précédent' },

          { id: 'conso-gas', component: 'FluidColumn', children: ['conso-gas-header', 'conso-gas-bar'] },
          { id: 'conso-gas-header', component: 'FluidRow', children: ['conso-gas-icon', 'conso-gas-trend'], gap: '6px' },
          { id: 'conso-gas-icon', component: 'FluidText', text: `Gaz — ${gasStats.currentMonth.total} ${gasStats.unit}`, variant: 'body' },
          { id: 'conso-gas-trend', component: 'FluidBadge',
            label: `${gasChange >= 0 ? '↑' : '↓'} ${Math.abs(gasChange)}%`,
            variant: gasChange > 10 ? 'danger' : gasChange > 0 ? 'warning' : 'success',
          },
          { id: 'conso-gas-bar', component: 'FluidProgress', value: Math.min(Math.round((gasStats.currentMonth.total / (gasStats.previousMonth.total || 1)) * 100), 100), max: 100, label: 'vs. mois précédent' },

          { id: 'divider-2', component: 'FluidDivider' },

          // ── Contracts Section ──
          { id: 'contracts-section', component: 'FluidCard', title: '📋 Mes contrats', children: contracts.map((_, i) => `ctr-${i}`) },
          ...contracts.map((c, i) => ({
            id: `ctr-${i}`,
            component: 'FluidRow',
            children: [`ctr-${i}-type`, `ctr-${i}-info`, `ctr-${i}-badge`],
            gap: '6px',
          })),
          ...contracts.map((c, i) => ({
            id: `ctr-${i}-type`,
            component: 'FluidTag',
            label: c.type === 'electricity' ? '⚡ Élec' : c.type === 'gas' ? '🔥 Gaz' : '☀️ Solaire',
            variant: c.type === 'electricity' ? 'info' : c.type === 'gas' ? 'warning' : 'success',
          })),
          ...contracts.map((c, i) => ({
            id: `ctr-${i}-info`,
            component: 'FluidText',
            text: `${c.reference} — ${c.address}${c.monthlyAmount > 0 ? ` — ${c.monthlyAmount.toFixed(2)} €/mois` : ''}`,
            variant: 'body' as const,
          })),
          ...contracts.map((c, i) => ({
            id: `ctr-${i}-badge`,
            component: 'FluidBadge',
            label: c.status === 'active' ? 'Actif' : c.status === 'pending' ? 'En attente' : 'Résilié',
            variant: c.status === 'active' ? 'success' : c.status === 'pending' ? 'warning' : 'danger',
          })),

          { id: 'divider-3', component: 'FluidDivider' },

          // ── Invoices Section ──
          { id: 'invoices-section', component: 'FluidCard', title: '🧾 Dernières factures', children: [
            ...unpaid.map((_, i) => `inv-unpaid-${i}`),
            ...lastPaid.map((_, i) => `inv-paid-${i}`),
          ] },
          ...unpaid.map((inv, i) => ({
            id: `inv-unpaid-${i}`,
            component: 'FluidRow',
            children: [`inv-unpaid-${i}-ref`, `inv-unpaid-${i}-amount`, `inv-unpaid-${i}-badge`],
            gap: '6px',
          })),
          ...unpaid.map((inv, i) => ({
            id: `inv-unpaid-${i}-ref`,
            component: 'FluidText',
            text: `${inv.reference} — ${inv.period}`,
            variant: 'body' as const,
          })),
          ...unpaid.map((inv, i) => ({
            id: `inv-unpaid-${i}-amount`,
            component: 'FluidText',
            text: `${inv.amount.toFixed(2)} €`,
            variant: 'h4' as const,
          })),
          ...unpaid.map((inv, i) => ({
            id: `inv-unpaid-${i}-badge`,
            component: 'FluidBadge',
            label: inv.status === 'overdue' ? '⚠️ En retard' : 'À payer',
            variant: inv.status === 'overdue' ? 'danger' : 'warning',
          })),
          ...lastPaid.map((inv, i) => ({
            id: `inv-paid-${i}`,
            component: 'FluidRow',
            children: [`inv-paid-${i}-ref`, `inv-paid-${i}-amount`, `inv-paid-${i}-badge`],
            gap: '6px',
          })),
          ...lastPaid.map((inv, i) => ({
            id: `inv-paid-${i}-ref`,
            component: 'FluidText',
            text: `${inv.reference} — ${inv.period}`,
            variant: 'body' as const,
          })),
          ...lastPaid.map((inv, i) => ({
            id: `inv-paid-${i}-amount`,
            component: 'FluidText',
            text: `${inv.amount.toFixed(2)} €`,
            variant: 'caption' as const,
          })),
          ...lastPaid.map((inv, i) => ({
            id: `inv-paid-${i}-badge`,
            component: 'FluidBadge',
            label: '✓ Payée',
            variant: 'success',
          })),
        ];

        // ── Alerts Section (dynamic) ──
        if (alerts.length > 0) {
          components.push(
            { id: 'divider-4', component: 'FluidDivider' },
            { id: 'alerts-section', component: 'FluidColumn', children: ['alerts-title', ...alerts.map((_, i) => `alert-${i}`)] },
            { id: 'alerts-title', component: 'FluidText', text: '🔔 Alertes et notifications', variant: 'h3' },
            ...alerts.map((a, i) => ({
              id: `alert-${i}`,
              component: 'FluidAlert',
              message: `${a.message} (${a.contractRef})`,
              severity: a.severity as 'info' | 'success' | 'warning' | 'danger',
            })),
          );
        }

        messages.push({
          version: 'v0.9',
          updateComponents: { surfaceId, components },
        });
      } else if (type === 'alerts') {
        const alerts = generateAlerts();
        messages.push({
          version: 'v0.9',
          updateComponents: {
            surfaceId,
            components: [
              { id: 'root', component: 'FluidColumn', children: ['title', ...alerts.map((_, i) => `alert-${i}`)] },
              { id: 'title', component: 'FluidText', text: '⚠️ Alertes et notifications', variant: 'h2' },
              ...alerts.map((a, i) => ({
                id: `alert-${i}`,
                component: 'FluidAlert',
                message: a.message,
                severity: a.severity as 'info' | 'success' | 'warning' | 'danger',
              })),
            ],
          },
        });
      } else if (type === 'contracts') {
        const contracts = mockContracts;
        messages.push({
          version: 'v0.9',
          updateComponents: {
            surfaceId,
            components: [
              { id: 'root', component: 'FluidColumn', children: ['title', ...contracts.map((_, i) => `card-${i}`)] },
              { id: 'title', component: 'FluidText', text: '📋 Mes contrats', variant: 'h2' },
              ...contracts.map((c, i) => ({
                id: `card-${i}`,
                component: 'FluidCard',
                title: c.reference,
                children: [`card-${i}-info`, `card-${i}-row`],
              })),
              ...contracts.map((c, i) => ({
                id: `card-${i}-info`,
                component: 'FluidText',
                text: `${c.type === 'electricity' ? '⚡' : c.type === 'gas' ? '🔥' : '☀️'} ${c.address}`,
                variant: 'body' as const,
              })),
              ...contracts.map((c, i) => ({
                id: `card-${i}-row`,
                component: 'FluidRow',
                children: [`card-${i}-badge`, `card-${i}-amount`],
                gap: '8px',
              })),
              ...contracts.map((c, i) => ({
                id: `card-${i}-badge`,
                component: 'FluidTag',
                label: c.type === 'electricity' ? 'Électricité' : c.type === 'gas' ? 'Gaz' : 'Solaire',
                variant: c.type === 'electricity' ? 'info' : c.type === 'gas' ? 'warning' : 'success',
              })),
              ...contracts.map((c, i) => ({
                id: `card-${i}-amount`,
                component: 'FluidText',
                text: `${c.monthlyAmount.toFixed(2)} €/mois`,
                variant: 'caption' as const,
              })),
            ],
          },
        });
      } else {
        // consumption or unknown — simple message
        messages.push({
          version: 'v0.9',
          updateComponents: {
            surfaceId,
            components: [
              { id: 'root', component: 'FluidColumn', children: ['title', 'msg'] },
              { id: 'title', component: 'FluidText', text: `📊 Dashboard: ${type}`, variant: 'h2' },
              { id: 'msg', component: 'FluidAlert', message: ctx ?? 'Dashboard en cours de construction', severity: 'info' },
            ],
          },
        });
      }

      return { messages };
    },
  }),
};

// ── Model selection ────────────────────────────────────────────────
// Gemini 3.1 Flash-Lite: $0.25/1M in, $1.50/1M out, 270 tok/s, 1M context
// 76.5% BFCL v3 tool calling, 97% structured output compliance
// Perfect for high-volume energy portal (10M+ customers)
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  const google = createGoogleGenerativeAI({ apiKey });
  return google(process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview');
}

// ── Vercel Serverless Handler ──────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const model = getModel();
  if (!model) {
    // Demo mode: return a mock streamed response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Vercel-AI-Data-Stream', 'v1');
    return res.status(200).end(
      '0:"Bienvenue sur l\'assistant ENGIE ! 🌿\\n\\nJe suis en mode démo — pour activer l\'IA complète, configurez `GEMINI_API_KEY`.\\n\\nEn attendant, explorez le portail pour gérer vos contrats, factures et consommation."\n'
    );
  }

  try {
    const { messages, sessionId: clientSessionId, userId } = req.body;

    // ── Session management ──────────────────────────────────────────
    let sessionId = clientSessionId as string | undefined;
    const currentUserId = (userId as string) || 'demo-user';

    // Create session on-the-fly if not provided
    if (!sessionId) {
      try {
        const session = await createSession(currentUserId);
        const parts = session.name.split('/');
        sessionId = parts[parts.length - 1];
      } catch (e) {
        console.warn('[chat] Session creation failed, continuing without persistence:', e);
      }
    }

    // Persist user message to Vertex AI session (full JSON for restore fidelity)
    const lastUserMsg = messages[messages.length - 1];
    const userText = lastUserMsg?.parts
      ?.filter((p: { type: string }) => p.type === 'text')
      ?.map((p: { text: string }) => p.text)
      ?.join('\n') ?? '';
    const invocationId = `inv-${Date.now()}`;

    if (sessionId && userText) {
      try {
        await appendEvent(sessionId, 'user', userText, invocationId);
      } catch (e) {
        console.warn('[chat] Failed to persist user event:', e);
      }
    }

    // ── Handle approved tool calls (HITL flow) ────────────────────────
    // When client sends approval-responded parts, execute the tool
    // and inject tool results before calling streamText
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedMessages = [...messages] as any[];
    const lastAssistantIdx = processedMessages.findLastIndex(
      (m: { role: string }) => m.role === 'assistant',
    );

    if (lastAssistantIdx >= 0) {
      const assistantMsg = processedMessages[lastAssistantIdx];
      const approvedToolParts = (assistantMsg.parts ?? []).filter(
        (p: { state?: string; approval?: { approved?: boolean } }) =>
          p.state === 'approval-responded' && p.approval?.approved === true,
      );

      if (approvedToolParts.length > 0) {
        // Execute approved tools and build tool result parts
        for (const part of approvedToolParts) {
          const toolName = part.toolName ?? part.type?.replace('tool-', '');
          const toolDef = tools[toolName as keyof typeof tools];
          if (toolDef) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await (toolDef as any).execute(part.input ?? {});
              // Update the part state to output-available
              part.state = 'output-available';
              part.output = result;
              delete part.approval;
            } catch (e) {
              console.warn(`[chat] Tool execution failed for ${toolName}:`, e);
              part.state = 'output-error';
              part.errorText = e instanceof Error ? e.message : 'Tool execution failed';
            }
          }
        }
      }
    }

    // Convert v6 UIMessages (parts array) to CoreMessages (content string) for streamText
    const modelMessages = await convertToModelMessages(processedMessages);

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools,
      maxSteps: 3,
      onError: (error) => {
        console.error('streamText error:', error);
      },
      onFinish: async ({ text, steps }) => {
        // Persist assistant response to Vertex AI session
        // Include tool call info so restored sessions show genui cards
        if (sessionId) {
          // Collect tool results from all steps for genui restore
          const toolResults: Array<{ toolName: string; result: unknown }> = [];
          for (const step of steps) {
            for (const tc of step.toolCalls ?? []) {
              const tr = step.toolResults?.find(
                (r: { toolCallId: string }) => r.toolCallId === tc.toolCallId,
              );
              if (tr) {
                toolResults.push({ toolName: tc.toolName, result: (tr as { output?: unknown }).output });
              }
            }
          }

          // If we have tool results, store as JSON for rich restore
          const payload = toolResults.length > 0
            ? `__json:${JSON.stringify({ text: text || '', toolResults })}`
            : text || '';

          if (payload) {
            try {
              await appendEvent(sessionId, 'agent', payload, invocationId);
            } catch (e) {
              console.warn('[chat] Failed to persist assistant event:', e);
            }
          }
        }
      },
    });

    // Include sessionId in response headers for client to track
    const streamHeaders: Record<string, string> = {};
    if (sessionId) {
      streamHeaders['X-Session-Id'] = sessionId;
      streamHeaders['Access-Control-Expose-Headers'] = 'X-Session-Id';
    }

    // Pipe the UI message stream to the Node.js response
    result.pipeUIMessageStreamToResponse(res, {
      headers: streamHeaders,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

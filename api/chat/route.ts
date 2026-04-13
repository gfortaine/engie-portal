import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, tool, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { appendEvent, createSession, getSession } from '../lib/vertex-sessions.js';

// ── Mock data (mirrors tRPC handler data) ──────────────────────────
const mockContracts = [
  { id: 'ctr_001', reference: 'ENGIE-ELEC-2024-78542', type: 'electricity', status: 'active', address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 87.50, meterNumber: 'PDL-14789632541' },
  { id: 'ctr_002', reference: 'ENGIE-GAZ-2024-32187', type: 'gas', status: 'active', address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 62.00, meterNumber: 'PCE-98765432100' },
  { id: 'ctr_003', reference: 'ENGIE-SOLAR-2025-10245', type: 'solar', status: 'pending', address: '42 Avenue des Champs-Élysées, 75008 Paris', startDate: '2025-06-01', monthlyAmount: 35.00, meterNumber: 'PDL-55512345678' },
  { id: 'ctr_004', reference: 'ENGIE-ELEC-2023-45678', type: 'electricity', status: 'terminated', address: '8 Boulevard Haussmann, 75009 Paris', startDate: '2023-03-01', endDate: '2025-02-28', monthlyAmount: 0, meterNumber: 'PDL-33345678901' },
];

const mockInvoices = [
  { id: 'inv_001', contractId: 'ctr_001', reference: 'FACT-2026-03-001', period: 'Mars 2026', issueDate: '2026-04-01', dueDate: '2026-04-15', amount: 94.32, status: 'pending', breakdown: { consumption: 72.40, subscription: 12.50, taxes: 9.42 } },
  { id: 'inv_002', contractId: 'ctr_001', reference: 'FACT-2026-02-001', period: 'Février 2026', issueDate: '2026-03-01', dueDate: '2026-03-15', amount: 102.87, status: 'paid', breakdown: { consumption: 80.10, subscription: 12.50, taxes: 10.27 } },
  { id: 'inv_003', contractId: 'ctr_002', reference: 'FACT-2026-03-002', period: 'Mars 2026', issueDate: '2026-04-01', dueDate: '2026-04-15', amount: 67.50, status: 'pending', breakdown: { consumption: 48.00, subscription: 11.00, taxes: 8.50 } },
  { id: 'inv_004', contractId: 'ctr_002', reference: 'FACT-2026-02-002', period: 'Février 2026', issueDate: '2026-03-01', dueDate: '2026-03-15', amount: 71.20, status: 'paid', breakdown: { consumption: 52.30, subscription: 11.00, taxes: 7.90 } },
  { id: 'inv_005', contractId: 'ctr_001', reference: 'FACT-2026-01-001', period: 'Janvier 2026', issueDate: '2026-02-01', dueDate: '2026-02-15', amount: 118.45, status: 'paid', breakdown: { consumption: 95.20, subscription: 12.50, taxes: 10.75 } },
  { id: 'inv_006', contractId: 'ctr_001', reference: 'FACT-2025-12-001', period: 'Décembre 2025', issueDate: '2026-01-01', dueDate: '2026-01-15', amount: 132.10, status: 'overdue', breakdown: { consumption: 108.50, subscription: 12.50, taxes: 11.10 } },
];

const mockAlerts = [
  { id: 'alert_001', type: 'overconsumption', severity: 'warning', contractRef: 'ENGIE-ELEC-2024-78542', message: 'Consommation électrique supérieure de 23% par rapport au mois dernier', date: '2026-04-10' },
  { id: 'alert_002', type: 'payment_due', severity: 'danger', contractRef: 'ENGIE-ELEC-2024-78542', message: 'Facture FACT-2025-12-001 en retard de paiement (132,10€)', date: '2026-04-01' },
  { id: 'alert_003', type: 'rate_change', severity: 'info', contractRef: 'ENGIE-GAZ-2024-32187', message: 'Nouveau tarif réglementé gaz applicable à partir du 1er mai 2026', date: '2026-04-05' },
  { id: 'alert_004', type: 'eco_tip', severity: 'success', contractRef: 'ENGIE-SOLAR-2025-10245', message: 'Votre installation solaire a produit 15% de plus que prévu ce mois-ci', date: '2026-04-12' },
];

function generateConsumptionStats(contractId: string) {
  const contract = mockContracts.find(c => c.id === contractId);
  const isElectric = contract?.type === 'electricity' || contract?.type === 'solar';
  const unit = isElectric ? 'kWh' : 'm³';
  return {
    contractRef: contract?.reference ?? contractId,
    type: contract?.type ?? 'unknown',
    unit,
    currentMonth: { period: 'Mars 2026', total: isElectric ? 342 : 128, dailyAvg: isElectric ? 11.0 : 4.1 },
    previousMonth: { period: 'Février 2026', total: isElectric ? 385 : 145, dailyAvg: isElectric ? 13.7 : 5.2 },
    yearOverYear: { currentYear: isElectric ? 1050 : 420, previousYear: isElectric ? 980 : 395, changePercent: isElectric ? 7.1 : 6.3 },
    trend: isElectric ? 'decreasing' : 'stable' as const,
    peakHours: isElectric ? { percentage: 35, recommendation: 'Décaler les cycles de lave-linge en heures creuses' } : null,
    monthlyData: [
      { month: 'Jan', value: isElectric ? 420 : 165 },
      { month: 'Fév', value: isElectric ? 385 : 145 },
      { month: 'Mar', value: isElectric ? 342 : 128 },
    ],
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
- suggestSavings: Proposer des économies d'énergie personnalisées`;

// ── Energy Domain Tools ────────────────────────────────────────────
const tools = {
  explainBill: tool({
    description: "Explique en détail une facture d'énergie avec la décomposition des coûts (consommation, abonnement, taxes). Utilise cet outil quand le client pose une question sur une facture.",
    inputSchema: z.object({
      invoiceRef: z.string().describe("Référence de la facture (ex: FACT-2026-03-001) ou 'latest' pour la dernière"),
    }),
    execute: async ({ invoiceRef }) => {
      const invoice = invoiceRef === 'latest'
        ? mockInvoices[0]
        : mockInvoices.find(i => i.reference === invoiceRef) ?? mockInvoices[0];
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
      return contractIds
        .map(id => {
          const contract = mockContracts.find(c => c.id === id);
          if (!contract) return null;
          const invoices = mockInvoices.filter(i => i.contractId === id);
          const totalSpent = invoices.reduce((sum, i) => sum + i.amount, 0);
          return { ...contract, invoiceCount: invoices.length, totalSpent: Math.round(totalSpent * 100) / 100 };
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
      if (severity && severity !== 'all') {
        return mockAlerts.filter(a => a.severity === severity);
      }
      return mockAlerts;
    },
  }),

  suggestSavings: tool({
    description: "Propose des recommandations d'économies d'énergie personnalisées basées sur les habitudes de consommation du client.",
    needsApproval: true,
    inputSchema: z.object({
      contractId: z.string().optional().describe("ID du contrat pour des recommandations ciblées"),
    }),
    execute: async ({ contractId }) => {
      const contract = mockContracts.find(c => c.id === (contractId ?? 'ctr_001'));
      const savings = [
        { id: 'sav_001', title: 'Heures creuses', description: 'Programmez vos appareils énergivores (lave-linge, lave-vaisselle) entre 22h et 6h', potentialSaving: '15%', impactEuros: 14.20, difficulty: 'easy', category: 'comportement' },
        { id: 'sav_002', title: 'Thermostat intelligent', description: 'Installez un thermostat connecté pour optimiser le chauffage selon votre présence', potentialSaving: '20%', impactEuros: 18.60, difficulty: 'medium', category: 'équipement' },
        { id: 'sav_003', title: 'Veille des appareils', description: 'Utilisez des multiprises à interrupteur pour couper la veille des appareils électroniques', potentialSaving: '10%', impactEuros: 9.30, difficulty: 'easy', category: 'comportement' },
        { id: 'sav_004', title: 'Isolation fenêtres', description: 'Vérifiez les joints de vos fenêtres — des joints usés peuvent augmenter votre facture de chauffage de 25%', potentialSaving: '25%', impactEuros: 23.25, difficulty: 'hard', category: 'travaux' },
      ];
      return {
        contractRef: contract?.reference,
        energyType: contract?.type,
        totalPotentialSaving: savings.reduce((sum, s) => sum + s.impactEuros, 0),
        recommendations: savings,
      };
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
  return google('gemini-3.1-flash-lite-preview');
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

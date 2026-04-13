import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { z } from 'zod';

// ── tRPC setup (self-contained for Vercel serverless) ──────────────
const t = initTRPC.context<{ auth: null }>().create({ transformer: superjson });

// ── Mock data ──────────────────────────────────────────────────────
const mockContracts = [
  { id: 'ctr_001', reference: 'ENGIE-ELEC-2024-78542', type: 'electricity' as const, status: 'active' as const, address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 87.50, meterNumber: 'PDL-14789632541' },
  { id: 'ctr_002', reference: 'ENGIE-GAZ-2024-32187', type: 'gas' as const, status: 'active' as const, address: '15 Rue de la Paix, 75002 Paris', startDate: '2024-01-15', monthlyAmount: 62.00, meterNumber: 'PCE-98765432100' },
  { id: 'ctr_003', reference: 'ENGIE-SOLAR-2025-10245', type: 'solar' as const, status: 'pending' as const, address: '42 Avenue des Champs-Élysées, 75008 Paris', startDate: '2025-06-01', monthlyAmount: 35.00, meterNumber: 'PDL-55512345678' },
  { id: 'ctr_004', reference: 'ENGIE-ELEC-2023-45678', type: 'electricity' as const, status: 'terminated' as const, address: '8 Boulevard Haussmann, 75009 Paris', startDate: '2023-03-01', endDate: '2025-02-28', monthlyAmount: 0, meterNumber: 'PDL-33345678901' },
];

const mockInvoices = [
  { id: 'inv_001', contractId: 'ctr_001', reference: 'FACT-2026-03-001', period: 'Mars 2026', issueDate: '2026-04-01', dueDate: '2026-04-15', amount: 94.32, status: 'pending' as const },
  { id: 'inv_002', contractId: 'ctr_001', reference: 'FACT-2026-02-001', period: 'Février 2026', issueDate: '2026-03-01', dueDate: '2026-03-15', amount: 102.87, status: 'paid' as const },
  { id: 'inv_003', contractId: 'ctr_002', reference: 'FACT-2026-03-002', period: 'Mars 2026', issueDate: '2026-04-01', dueDate: '2026-04-15', amount: 67.50, status: 'pending' as const },
  { id: 'inv_004', contractId: 'ctr_002', reference: 'FACT-2026-02-002', period: 'Février 2026', issueDate: '2026-03-01', dueDate: '2026-03-15', amount: 71.20, status: 'paid' as const },
  { id: 'inv_005', contractId: 'ctr_001', reference: 'FACT-2026-01-001', period: 'Janvier 2026', issueDate: '2026-02-01', dueDate: '2026-02-15', amount: 118.45, status: 'paid' as const },
  { id: 'inv_006', contractId: 'ctr_001', reference: 'FACT-2025-12-001', period: 'Décembre 2025', issueDate: '2026-01-01', dueDate: '2026-01-15', amount: 132.10, status: 'overdue' as const },
];

function generateConsumptionData(contractId: string, period: string) {
  const [year, month] = period.split('-').map(Number);
  const daysInMonth = new Date(year!, (month ?? 1), 0).getDate();
  const seed = contractId.charCodeAt(4) + (month ?? 1) * 17 + (year ?? 2026) * 3;
  const random = (i: number) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
  const isElectric = contractId === 'ctr_001' || contractId === 'ctr_003';
  const unit = isElectric ? 'kWh' : 'm³';
  const baseValue = isElectric ? 12 : 4;
  const points = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${period}-${String(i + 1).padStart(2, '0')}`,
    value: Math.round((baseValue + random(i) * 8) * 10) / 10,
    unit: unit as 'kWh' | 'm³',
  }));
  const total = Math.round(points.reduce((sum, p) => sum + p.value, 0) * 10) / 10;
  const prevTotal = Math.round(total * (0.85 + random(99) * 0.3) * 10) / 10;
  const percentChange = Math.round(((total - prevTotal) / prevTotal) * 100);
  return { contractId, period, total, unit: unit as 'kWh' | 'm³', points, comparisonPeriod: { total: prevTotal, percentChange } };
}

// ── Routers ────────────────────────────────────────────────────────
const appRouter = t.router({
  contract: t.router({
    list: t.procedure.query(() => mockContracts),
    getById: t.procedure.input(z.string()).query(({ input }) => {
      const c = mockContracts.find((c) => c.id === input);
      if (!c) throw new Error(`Contract ${input} not found`);
      return c;
    }),
  }),
  invoice: t.router({
    list: t.procedure.query(() => mockInvoices),
    getById: t.procedure.input(z.string()).query(({ input }) => {
      const inv = mockInvoices.find((i) => i.id === input);
      if (!inv) throw new Error(`Invoice ${input} not found`);
      return inv;
    }),
  }),
  consumption: t.router({
    getData: t.procedure
      .input(z.object({ contractId: z.string(), period: z.string() }))
      .query(({ input }) => generateConsumptionData(input.contractId, input.period)),
  }),
});

// ── Handler ────────────────────────────────────────────────────────
export const config = { runtime: 'nodejs', maxDuration: 10 };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200 });
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ auth: null }),
  });
}

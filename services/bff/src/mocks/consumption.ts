export function generateConsumptionData(contractId: string, period: string) {
  const [year, month] = period.split('-').map(Number);
  const daysInMonth = new Date(year!, (month ?? 1), 0).getDate();

  const seed = contractId.charCodeAt(4) + (month ?? 1) * 17 + (year ?? 2026) * 3;
  const random = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

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

  return {
    contractId,
    period,
    total,
    unit: unit as 'kWh' | 'm³',
    points,
    comparisonPeriod: {
      total: prevTotal,
      percentChange,
    },
  };
}

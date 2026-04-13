import { NJSkeletonRectangle } from '@engie-group/fluid-design-system-react';

const toolSkeletonShapes: Record<string, { rows: number; height: number }> = {
  explainBill: { rows: 5, height: 180 },
  analyzeConsumption: { rows: 4, height: 220 },
  compareContracts: { rows: 6, height: 200 },
  findContract: { rows: 3, height: 120 },
  getAlerts: { rows: 3, height: 140 },
  suggestSavings: { rows: 4, height: 200 },
};

export function ToolSkeleton({ toolName }: { toolName: string }) {
  const shape = toolSkeletonShapes[toolName] ?? { rows: 3, height: 120 };

  return (
    <div className="genui-skeleton" role="status" aria-label="Chargement...">
      <div className="genui-skeleton__header">
        <NJSkeletonRectangle height="20px" width="60%" />
        <NJSkeletonRectangle height="16px" width="30%" />
      </div>
      <div className="genui-skeleton__body" style={{ minHeight: `${shape.height}px` }}>
        {Array.from({ length: shape.rows }, (_, i) => (
          <NJSkeletonRectangle
            key={i}
            height="16px"
            width={`${90 - i * 10}%`}
          />
        ))}
      </div>
    </div>
  );
}

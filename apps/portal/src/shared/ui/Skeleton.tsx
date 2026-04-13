import { NJSkeletonRectangle } from '@engie-group/fluid-design-system-react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ width = '100%', height = 20 }: SkeletonProps) {
  return (
    <NJSkeletonRectangle
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

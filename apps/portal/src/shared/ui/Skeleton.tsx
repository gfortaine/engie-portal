import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ width = '100%', height = 20 }: SkeletonProps) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

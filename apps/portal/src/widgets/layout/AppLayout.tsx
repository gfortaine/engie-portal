import { type ReactNode } from 'react';
import { Header } from '@/widgets/header/Header';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

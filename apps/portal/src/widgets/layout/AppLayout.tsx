import { type ReactNode } from 'react';
import { NJFooter } from '@engie-group/fluid-design-system-react';
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
        <div className={styles.mainWrapper}>
          <main className={styles.main}>{children}</main>
          <NJFooter
            links={[
              { url: '#', text: 'Mentions légales' },
              { url: '#', text: 'Données personnelles' },
              { url: '#', text: 'Cookies' },
              { url: '#', text: 'Accessibilité' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

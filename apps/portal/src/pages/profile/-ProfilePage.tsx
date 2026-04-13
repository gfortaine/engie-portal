import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import { Card } from '@/shared/ui/Card';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAppAuth();

  return (
    <div className={styles.page}>
      <h1>{t('profile.title')}</h1>

      <Card className={styles.profileCard}>
        <div className={styles.avatar}>
          {user?.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div className={styles.info}>
          <div className={styles.field}>
            <label>{t('profile.name')}</label>
            <p>{user?.name}</p>
          </div>
          <div className={styles.field}>
            <label>{t('profile.email')}</label>
            <p>{user?.email}</p>
          </div>
          <div className={styles.field}>
            <label>{t('profile.tenant')}</label>
            <p>{user?.tenantId}</p>
          </div>
          <div className={styles.field}>
            <label>{t('profile.roles')}</label>
            <p>{user?.roles.join(', ')}</p>
          </div>
        </div>
      </Card>

      <Card className={styles.preferencesCard}>
        <h2>{t('profile.preferences')}</h2>
        <div className={styles.field}>
          <label>{t('profile.language')}</label>
          <LanguageSelector />
        </div>
      </Card>
    </div>
  );
}

function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className={styles.langSelect}
    >
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
  );
}

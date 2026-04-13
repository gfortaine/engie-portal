import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJDivider } from '@engie-group/fluid-design-system-react';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAppAuth();

  return (
    <div className={styles.page}>
      <NJDisplay scale="xs" as="h1">{t('profile.title')}</NJDisplay>

      <NJCard className={styles.profileCard}>
        <NJCardBody>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {user?.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <NJHeading scale="sm">{user?.name}</NJHeading>
              <NJText variant="secondary">{user?.email}</NJText>
            </div>
          </div>

          <NJDivider />

          <div className={styles.info}>
            <div className={styles.field}>
              <NJText scale="xs" variant="secondary">{t('profile.tenant')}</NJText>
              <NJText>{user?.tenantId}</NJText>
            </div>
            <div className={styles.field}>
              <NJText scale="xs" variant="secondary">{t('profile.roles')}</NJText>
              <NJText>{user?.roles.join(', ')}</NJText>
            </div>
          </div>
        </NJCardBody>
      </NJCard>

      <NJCard>
        <NJCardBody>
          <NJHeading scale="xs">{t('profile.preferences')}</NJHeading>
          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <NJText scale="xs" variant="secondary">{t('profile.language')}</NJText>
            <LanguageSelector />
          </div>
        </NJCardBody>
      </NJCard>
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

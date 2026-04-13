import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJDivider, NJAvatarRoot, NJToggle, NJSelectRoot, NJSelectItem } from '@engie-group/fluid-design-system-react';
import { PageBreadcrumb } from '@/shared/ui/PageBreadcrumb';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAppAuth();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('') ?? '';

  return (
    <div className={styles.page}>
      <PageBreadcrumb items={[{ label: t('nav.dashboard'), to: '/' }, { label: t('profile.title') }]} />
      <NJDisplay scale="xs" as="h1">{t('profile.title')}</NJDisplay>

      <NJCard className={styles.profileCard}>
        <NJCardBody>
          <div className={styles.profileHeader}>
            <NJAvatarRoot
              initials={initials}
              label={user?.name ?? ''}
              scale="3xl"
            />
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
          <div className={styles.prefsGrid}>
            <div className={styles.field}>
              <NJText scale="xs" variant="secondary">{t('profile.language')}</NJText>
              <LanguageSelector />
            </div>
            <div className={styles.field}>
              <NJText scale="xs" variant="secondary">{t('profile.notifications', 'Notifications')}</NJText>
              <NJToggle
                label={t('profile.emailNotifications', 'Email notifications')}
                defaultChecked
              />
            </div>
          </div>
        </NJCardBody>
      </NJCard>
    </div>
  );
}

function LanguageSelector() {
  const { i18n, t } = useTranslation();

  return (
    <NJSelectRoot
      id="lang-select"
      label={t('profile.language')}
      value={i18n.language}
      onChange={(v) => v && i18n.changeLanguage(v)}
    >
      <NJSelectItem value="fr">Français</NJSelectItem>
      <NJSelectItem value="en">English</NJSelectItem>
    </NJSelectRoot>
  );
}

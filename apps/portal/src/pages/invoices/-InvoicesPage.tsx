import { useTranslation } from 'react-i18next';
import { useGetInvoicesQuery } from '@/entities/invoice';
import { NJDisplay, NJButton, NJInlineMessage } from '@engie-group/fluid-design-system-react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './InvoicesPage.module.css';

export function InvoicesPage() {
  const { t } = useTranslation();
  const { data: invoices, isLoading, error } = useGetInvoicesQuery();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <NJDisplay scale="xs" as="h1">{t('invoices.title')}</NJDisplay>
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <NJDisplay scale="xs" as="h1">{t('invoices.title')}</NJDisplay>
        <NJInlineMessage variant="danger">
          {t('errors.loadFailed')}
        </NJInlineMessage>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NJDisplay scale="xs" as="h1">{t('invoices.title')}</NJDisplay>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('invoices.reference')}</th>
              <th>{t('invoices.period')}</th>
              <th>{t('invoices.issueDate')}</th>
              <th>{t('invoices.dueDate')}</th>
              <th>{t('invoices.amount')}</th>
              <th>{t('invoices.status')}</th>
              <th>{t('invoices.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((invoice) => (
              <tr key={invoice.id}>
                <td className={styles.reference}>{invoice.reference}</td>
                <td>{invoice.period}</td>
                <td>{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</td>
                <td className={styles.amount}>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(invoice.amount)}
                </td>
                <td>
                  <StatusBadge status={invoice.status} />
                </td>
                <td>
                  <NJButton
                    emphasis="minimal"
                    variant="secondary"
                    scale="sm"
                    icon="download"
                    label={t('invoices.download')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

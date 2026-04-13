import { useTranslation } from 'react-i18next';
import { useGetInvoicesQuery } from '@/entities/invoice';
import { Card } from '@/shared/ui/Card';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './InvoicesPage.module.css';

export function InvoicesPage() {
  const { t } = useTranslation();
  const { data: invoices, isLoading, error } = useGetInvoicesQuery();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <h1>{t('invoices.title')}</h1>
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
        <h1>{t('invoices.title')}</h1>
        <Card variant="error">
          <p>{t('errors.loadFailed')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>{t('invoices.title')}</h1>
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
                  <button className={styles.downloadBtn}>
                    📄 {t('invoices.download')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

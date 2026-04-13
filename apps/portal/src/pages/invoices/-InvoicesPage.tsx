import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetInvoicesQuery } from '@/entities/invoice';
import { NJDisplay, NJButton, NJInlineMessage, NJInputSearch, NJPaginationRoot, NJPaginationItem, NJPaginationArrow } from '@engie-group/fluid-design-system-react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import { PageBreadcrumb } from '@/shared/ui/PageBreadcrumb';
import styles from './InvoicesPage.module.css';

const PAGE_SIZE = 5;

export function InvoicesPage() {
  const { t } = useTranslation();
  const { data: invoices, isLoading, error } = useGetInvoicesQuery();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.reference.toLowerCase().includes(q) ||
        inv.period.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        {/* @ts-expect-error Fluid DS v6 types mismatch */}
        <NJInlineMessage variant="danger">
          {t('errors.loadFailed')}
        </NJInlineMessage>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageBreadcrumb items={[{ label: t('nav.dashboard'), to: '/' }, { label: t('invoices.title') }]} />
      <NJDisplay scale="xs" as="h1">{t('invoices.title')}</NJDisplay>

      <div className={styles.toolbar}>
        <NJInputSearch
          id="invoice-search"
          // @ts-expect-error Fluid DS v6 types mismatch
          label={t('invoices.search', 'Rechercher une facture')}
          value={search}
          // @ts-expect-error Fluid DS v6 types mismatch
          onChange={(_e, v) => { setSearch(v ?? ''); setPage(1); }}
        />
      </div>

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
            {paged.map((invoice) => (
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

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {/* @ts-expect-error Fluid DS v6 types mismatch */}
          <NJPaginationRoot>
            <NJPaginationArrow
              // @ts-expect-error Fluid DS v6 types mismatch
              direction="previous"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            {Array.from({ length: totalPages }).map((_, i) => (
              <NJPaginationItem
                key={i}
                // @ts-expect-error Fluid DS v6 types mismatch
                selected={i + 1 === page}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </NJPaginationItem>
            ))}
            <NJPaginationArrow
              // @ts-expect-error Fluid DS v6 types mismatch
              direction="next"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </NJPaginationRoot>
        </div>
      )}
    </div>
  );
}

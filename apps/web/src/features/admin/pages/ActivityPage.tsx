import { AUDIT_ENTITIES, type AuditEntity, type AuditLogDTO } from '@portfolio/shared';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { PageLoader } from '@/components/PageLoader';
import {
  ACTION_BADGES,
  describeEvent,
  ENTITY_FILTER_LABELS,
  fieldLabel,
  formatAbsolute,
  formatRelative,
  formatValue,
  toChangeRows,
} from '../activity';
import { useAuditLogs } from '../api';
import styles from '../admin.module.scss';

type Filter = AuditEntity | 'ALL';

const ACTION_TONE: Record<AuditLogDTO['action'], string | undefined> = {
  CREATE: styles.toneSuccess,
  UPDATE: styles.toneAccent,
  DELETE: styles.toneDanger,
  LOGIN: undefined,
  LOGIN_FAILED: styles.toneDanger,
  LOGOUT: undefined,
};

function EventDetails({ log }: { log: AuditLogDTO }) {
  const rows = toChangeRows(log);
  const showBefore = log.action !== 'CREATE';
  const showAfter = log.action !== 'DELETE';

  return (
    <details className={styles.eventDetails}>
      <summary>Detalhes</summary>

      {rows.length > 0 && (
        <div className={styles.diffWrapper}>
          <table className={styles.diffTable}>
            <thead>
              <tr>
                <th>Campo</th>
                {showBefore && <th>Antes</th>}
                {showAfter && <th>Depois</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.field}>
                  <td>{fieldLabel(row.field)}</td>
                  {showBefore && <td className={styles.diffBefore}>{formatValue(row.from)}</td>}
                  {showAfter && <td className={styles.diffAfter}>{formatValue(row.to)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className={styles.eventMeta}>
        <dt>IP</dt>
        <dd>{log.ip ?? '—'}</dd>
        <dt>Navegador</dt>
        <dd>{log.userAgent ?? '—'}</dd>
        <dt>Request ID</dt>
        <dd>
          <code>{log.requestId ?? '—'}</code>
        </dd>
      </dl>
    </details>
  );
}

function EventItem({ log }: { log: AuditLogDTO }) {
  const { verb, target } = describeEvent(log);
  const changedFields =
    log.action === 'UPDATE' ? toChangeRows(log).map((row) => fieldLabel(row.field)) : [];
  const actor =
    log.action === 'LOGIN_FAILED'
      ? (log.entityLabel ?? 'Alguém')
      : (log.actorEmail ?? 'Admin removido');

  return (
    <li className={styles.event}>
      <span className={`${styles.badge} ${ACTION_TONE[log.action] ?? ''}`}>
        {ACTION_BADGES[log.action]}
      </span>

      <div className={styles.eventBody}>
        <p>
          <strong>{actor}</strong> {verb} {target && <strong>{target}</strong>}
        </p>
        {changedFields.length > 0 && (
          <p className={styles.muted}>Campos: {changedFields.join(', ')}</p>
        )}
        <EventDetails log={log} />
      </div>

      <time
        className={styles.eventTime}
        dateTime={log.createdAt}
        title={formatAbsolute(log.createdAt)}
      >
        {formatRelative(log.createdAt)}
      </time>
    </li>
  );
}

export function ActivityPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAuditLogs(filter);
  const logs = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1>Atividade</h1>
          <p className={styles.muted}>
            Trilha de auditoria: cada alteração feita no painel, com autor, horário e origem. Os
            registros não podem ser editados nem apagados.
          </p>
        </div>
        <label className={styles.filter}>
          <span className="visually-hidden">Filtrar por tipo</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
            <option value="ALL">Todas as atividades</option>
            {AUDIT_ENTITIES.map((entity) => (
              <option key={entity} value={entity}>
                {ENTITY_FILTER_LABELS[entity]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending && <PageLoader />}
      {isError && <p className={styles.error}>Não foi possível carregar a atividade.</p>}
      {!isPending && logs.length === 0 && (
        <p className={styles.muted}>Nenhuma atividade registrada.</p>
      )}

      {logs.length > 0 && (
        <ol className={`${styles.card} ${styles.timeline}`}>
          {logs.map((log) => (
            <EventItem key={log.id} log={log} />
          ))}
        </ol>
      )}

      {hasNextPage && (
        <div className={styles.loadMore}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </>
  );
}

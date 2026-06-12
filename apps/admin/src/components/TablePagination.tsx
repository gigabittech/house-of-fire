'use client';

import type { CSSProperties } from 'react';
import { adminLayout } from '@/lib/adminLayout';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const DEFAULT_PAGE_SIZE = 25;

export function TablePagination({ page, pageSize, total, onPageChange }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  if (total <= pageSize) return null;

  return (
    <div className={adminLayout.pagination}>
      <span>
        {start}–{end} of {total}
      </span>
      <div className={adminLayout.paginationControls}>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          style={paginationButtonStyle(safePage <= 1)}
        >
          Previous
        </button>
        <span
          style={{
            padding: '6px 10px',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--hof-text)',
          }}
        >
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          style={paginationButtonStyle(safePage >= totalPages)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function paginationButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid var(--hof-border)',
    background: disabled ? 'var(--hof-elevated)' : 'var(--hof-surface)',
    fontFamily: 'Inter, system-ui',
    fontSize: 12,
    color: disabled ? 'var(--hof-text-dis)' : 'var(--hof-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

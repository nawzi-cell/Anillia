import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Mark sortable; sorting uses `sortValue(row)` when provided. */
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  onRowClick?: (row: T) => void;
}

/**
 * Generic data table with built-in client-side sorting.
 * Wraps the table in a horizontal scroller so wide tables stay contained
 * inside the card on mobile.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  defaultSortKey,
  defaultSortDir = "asc",
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey && c.sortable);
    if (!col) return rows;
    const get = col.sortValue ?? (() => undefined);
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc"
        ? sa.localeCompare(sb)
        : sb.localeCompare(sa);
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left font-sans text-sm">
        <thead>
          <tr className="border-b border-espresso/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-espresso-muted ${col.headerClassName ?? ""}`}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col)}
                    className="inline-flex items-center gap-1 hover:text-espresso"
                  >
                    {col.header}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ChevronsUpDown size={12} className="opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-espresso/5 last:border-0 hover:bg-espresso/[0.03] ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-3 align-middle text-espresso ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center">
                {empty ?? (
                  <span className="text-sm text-espresso-muted">
                    No records found.
                  </span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

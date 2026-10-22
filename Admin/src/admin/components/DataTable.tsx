import { useId, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./states/EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
}

export interface DataTableFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  filters?: DataTableFilter<T>[];
  searchable?: (row: T) => string;
  searchPlaceholder?: string;
  rowKey: (row: T) => string;
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  initialFilterValues?: Record<string, string>;
}

export function DataTable<T>({
  data,
  columns,
  filters = [],
  searchable,
  searchPlaceholder = "Search…",
  rowKey,
  selectedKey,
  onRowClick,
  rowActions,
  pageSize = 10,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your search or filters.",
  toolbarLeft,
  toolbarRight,
  initialFilterValues = {},
}: DataTableProps<T>) {
  const filterId = useId();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(initialFilterValues);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = data;
    if (searchable && query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => searchable(r).toLowerCase().includes(q));
    }
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== "__all") rows = rows.filter((r) => f.match(r, val));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const dir = sortDir === "asc" ? 1 : -1;
        rows = [...rows].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }
    }
    return rows;
  }, [data, query, filterValues, sortKey, sortDir, columns, filters, searchable]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(pageSafe * pageSize, (pageSafe + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortKey(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {searchable ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`${filterId}-search`}
                name={`${filterId}-search`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 w-56 pl-8 text-sm"
              />
            </div>
          ) : null}
          {filters.map((f) => (
            <select
              key={f.key}
              id={`${filterId}-${f.key}`}
              name={`${filterId}-${f.key}`}
              aria-label={`${f.label} filter`}
              value={filterValues[f.key] ?? "__all"}
              onChange={(e) => {
                setFilterValues((v) => ({ ...v, [f.key]: e.target.value }));
                setPage(0);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="__all">All {f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          {toolbarLeft}
        </div>
        <div className="flex items-center gap-2">{toolbarRight}</div>
      </div>

      <div className="surface-1 overflow-hidden rounded-lg border border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead
                    key={c.key}
                    className={cn(
                      "text-[11px] uppercase tracking-wider text-muted-foreground",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.headerClassName,
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.header}
                        {sortKey === c.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                ))}
                {rowActions ? (
                  <TableHead className="w-1 text-right text-[11px] uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (rowActions ? 1 : 0)}>
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    className={cn(
                      "border-border/50",
                      onRowClick && "cursor-pointer",
                      selectedKey === rowKey(row) && "bg-primary/10",
                      onRowClick &&
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    )}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-selected={onRowClick ? selectedKey === rowKey(row) : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (
                              (event.key === "Enter" || event.key === " ") &&
                              event.target === event.currentTarget
                            ) {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(
                          "text-sm text-foreground/90",
                          c.align === "right" && "text-right",
                          c.align === "center" && "text-center",
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </TableCell>
                    ))}
                    {rowActions ? (
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="mono text-foreground">{pageRows.length}</span> of{" "}
          <span className="mono text-foreground">{filtered.length}</span>
          {filtered.length !== data.length ? (
            <>
              {" "}
              (filtered from <span className="mono">{data.length}</span>)
            </>
          ) : null}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageSafe === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <span className="mono">
            Page {pageSafe + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageSafe >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

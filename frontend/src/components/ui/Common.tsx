import { Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
      />

      <input
        className="input w-full !pl-10"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            tone === "primary" ? "bg-primary-50 text-primary-600" : "bg-accent-100 text-accent-600"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
      <span className="text-ink/50">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        <button className="btn-outline px-3 py-1" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button
          className="btn-outline px-3 py-1"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

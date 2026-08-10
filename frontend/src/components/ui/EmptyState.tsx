import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line py-14 text-center px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Icon size={22} />
      </div>
      <div>
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink/60 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

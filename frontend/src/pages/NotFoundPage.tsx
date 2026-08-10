import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface text-center px-6">
      <CompassIcon size={32} className="text-primary-600" />
      <h1 className="font-display text-3xl text-ink">Page not found</h1>
      <p className="text-sm text-ink/60">The page you're looking for doesn't exist.</p>
      <Link to="/login" className="btn-primary mt-3">
        Back to sign in
      </Link>
    </div>
  );
}

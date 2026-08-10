import { Outlet } from "react-router-dom";
import { HeartPulse } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="hidden lg:flex flex-col justify-between bg-primary-700 p-12 text-primary-50">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 font-display text-lg">
            M
          </div>
          <span className="font-display text-xl">MediCore</span>
        </div>
        <div>
          <HeartPulse size={40} className="mb-6 text-accent-500" />
          <h1 className="font-display text-4xl leading-tight text-white">
            Care coordination,
            <br />
            without the friction.
          </h1>
          <p className="mt-4 max-w-md text-primary-100/80">
            One system for patients, doctors, receptionists, and administrators — appointments,
            prescriptions, and records, all in sync.
          </p>
        </div>
        <p className="text-xs text-primary-100/50">© {new Date().getFullYear()} MediCore Hospital Systems</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../services/api";

interface FormValues {
  password: string;
  confirm_password: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authService.resetPassword(token, values.password);
      navigate("/login");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="font-display text-2xl text-ink">Invalid reset link</h2>
        <p className="mt-2 text-sm text-ink/60">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Set a new password</h2>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            className="input"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            className="input"
            {...register("confirm_password", {
              validate: (v) => v === watch("password") || "Passwords do not match",
            })}
          />
          {errors.confirm_password && <p className="mt-1 text-xs text-danger">{errors.confirm_password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../services/api";

interface FormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <MailCheck size={22} />
        </div>
        <h2 className="mt-4 font-display text-2xl text-ink">Check your email</h2>
        <p className="mt-2 text-sm text-ink/60">
          If that email is registered, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Reset your password</h2>
      <p className="mt-1 text-sm text-ink/60">Enter your email and we'll send you a reset link.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" {...register("email", { required: "Email is required" })} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

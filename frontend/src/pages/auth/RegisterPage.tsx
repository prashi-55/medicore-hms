import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

interface FormValues {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export function RegisterPage() {
  const { register: registerUser } = useAuth();
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
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });
      navigate("/patient/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Create your account</h2>
      <p className="mt-1 text-sm text-ink/60">Patient registration — book appointments in minutes.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}

        <div>
          <label className="label">Full name</label>
          <input className="input" {...register("full_name", { required: "Full name is required" })} />
          {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input type="email" className="input" {...register("email", { required: "Email is required" })} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Phone (optional)</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit phone number"
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9]{10}$/,
                message: "Phone number must be exactly 10 digits",
              },
            })}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value
                .replace(/\D/g, "")
                .slice(0, 10);
            }}
          />
        </div>

        <div>
          <label className="label">Password</label>
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
              required: "Please confirm your password",
              validate: (v) => v === watch("password") || "Passwords do not match",
            })}
          />
          {errors.confirm_password && <p className="mt-1 text-xs text-danger">{errors.confirm_password.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          <UserPlus size={16} />
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

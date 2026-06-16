"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import "@/styles/auth-forms.css";

import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";
import Spinner from "@/components/Spinner";

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

// Only same-site relative paths are safe redirect targets ("//host" and
// absolute URLs would be open redirects).
function safeRedirectTarget(): string {
  const raw = new URLSearchParams(window.location.search).get("next");
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/feed";
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: FormErrors = {
      email: validateEmail(email),
      // Login mirrors the server's loginSchema: presence only, so existing
      // passwords shorter than the current signup minimum still work.
      password: password ? undefined : "Password is required",
    };
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await login({ email: email.trim(), password });
      router.replace(safeRedirectTarget());
      router.refresh();
      // Keep `pending` true so the button stays disabled while navigating.
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      const hasFieldErrors =
        apiError !== null && Object.keys(apiError.fieldErrors).length > 0;
      setErrors(
        hasFieldErrors
          ? apiError.fieldErrors
          : {
              form:
                apiError?.message ?? "Something went wrong. Please try again.",
            }
      );
      setPending(false);
    }
  }

  return (
    <form className="_social_login_form" onSubmit={handleSubmit} noValidate>
      {errors.form && (
        <div className="_auth_alert" role="alert">
          {errors.form}
        </div>
      )}
      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label htmlFor="login-email" className="_social_login_label _mar_b8">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`form-control _social_login_input${
                errors.email ? " is-invalid" : ""
              }`}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && (
              <p id="login-email-error" className="_auth_error" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label
              htmlFor="login-password"
              className="_social_login_label _mar_b8"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`form-control _social_login_input${
                errors.password ? " is-invalid" : ""
              }`}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
            />
            {errors.password && (
              <p id="login-password-error" className="_auth_error" role="alert">
                {errors.password}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="form-check _social_login_form_check">
            <input
              className="form-check-input _social_login_form_check_input"
              type="radio"
              name="flexRadioDefault"
              id="flexRadioDefault2"
              defaultChecked
            />
            <label
              className="form-check-label _social_login_form_check_label"
              htmlFor="flexRadioDefault2"
            >
              Remember me
            </label>
          </div>
        </div>
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="_social_login_form_left">
            <p className="_social_login_form_left_para">Forgot password?</p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_login_form_btn _mar_t40 _mar_b60">
            <button
              type="submit"
              className="_social_login_form_btn_link _btn1 _auth_submit_btn"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Spinner size={16} /> Logging in…
                </span>
              ) : (
                "Login now"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

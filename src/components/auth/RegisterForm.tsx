"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import "@/styles/auth-forms.css";

import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";
import {
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/lib/validation";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
}: FieldProps) {
  return (
    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
      <div className="_social_registration_form_input _mar_b14">
        <label htmlFor={id} className="_social_registration_label _mar_b8">
          {label}
        </label>
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`form-control _social_registration_input${
            error ? " is-invalid" : ""
          }`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error && (
          <p id={`${id}-error`} className="_auth_error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: FormErrors = {
      firstName: validateName("First name", firstName),
      lastName: validateName("Last name", lastName),
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirmPassword:
        confirmPassword === password ? undefined : "Passwords do not match",
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      router.replace("/feed");
      router.refresh();
      // Keep `pending` true so the button stays disabled while navigating.
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.status === 409) {
        // Duplicate email — point at the field the user must change.
        setErrors({ email: apiError.message });
      } else if (apiError && Object.keys(apiError.fieldErrors).length > 0) {
        setErrors(apiError.fieldErrors);
      } else {
        setErrors({
          form: apiError?.message ?? "Something went wrong. Please try again.",
        });
      }
      setPending(false);
    }
  }

  return (
    <form
      className="_social_registration_form"
      onSubmit={handleSubmit}
      noValidate
    >
      {errors.form && (
        <div className="_auth_alert" role="alert">
          {errors.form}
        </div>
      )}
      <div className="row">
        <Field
          id="firstName"
          label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          error={errors.firstName}
        />
        <Field
          id="lastName"
          label="Last name"
          autoComplete="family-name"
          value={lastName}
          onChange={setLastName}
          error={errors.lastName}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <Field
          id="confirmPassword"
          label="Repeat Password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />
      </div>
      <div className="row">
        <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
          <div className="form-check _social_registration_form_check">
            <input
              className="form-check-input _social_registration_form_check_input"
              type="radio"
              name="flexRadioDefault"
              id="flexRadioDefault2"
              defaultChecked
            />
            <label
              className="form-check-label _social_registration_form_check_label"
              htmlFor="flexRadioDefault2"
            >
              I agree to terms &amp; conditions
            </label>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_registration_form_btn _mar_t40 _mar_b60">
            <button
              type="submit"
              className="_social_registration_form_btn_link _btn1 _auth_submit_btn"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Creating account…" : "Register Now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

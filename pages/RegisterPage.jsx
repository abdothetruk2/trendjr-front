import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { UserRound, Mail, Phone, LockKeyhole, ArrowRight, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import { getErrorMessage } from "../src/services/api";

const MIN_PASSWORD = 8; // same rule as the backend

// The backend sends friendly 409 messages; this covers its generic index error too
function registerError(err) {
  const message = getErrorMessage(err);
  if (/duplicate value for: username/i.test(message)) return "Username is already taken";
  if (/duplicate value for: email/i.test(message)) return "An account with this email already exists";
  return message;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", confirm: "", terms: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  function validate() {
    if (!form.username.trim()) return "Please choose a username.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Please enter a valid email address.";
    if (form.password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (form.password !== form.confirm) return "The passwords don't match.";
    if (!form.terms) return "Please accept the Terms of Service and Privacy Policy.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(registerError(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-surface px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card md:grid-cols-2">
        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-secondary p-10 text-white md:flex">
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full border-[38px] border-primary-500/20" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500"><ShoppingBag /></span>
            <h2 className="mt-8 text-4xl font-black leading-tight">Make room<br />for great finds.</h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">Create an account to save products, follow your orders, and enjoy a smoother shopping experience.</p>
          </div>
          <p className="relative text-xs text-slate-400">It only takes a moment to get started.</p>
        </div>

        <div className="p-7 sm:p-12">
          <p className="eyebrow">Join our community</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">Create your account</h1>
          <p className="mt-3 text-sm text-slate-500">Fill in your details to get started.</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
                <AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <label className="block text-xs font-bold text-slate-600">Username
              <span className="relative mt-2 block">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="username" value={form.username} onChange={update} autoComplete="username" className="input pl-10" placeholder="Choose a username" />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">Email address
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" className="input pl-10" placeholder="you@example.com" />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">Phone <span className="font-normal text-slate-400">(optional)</span>
              <span className="relative mt-2 block">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" className="input pl-10" placeholder="Your phone number" />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">Password
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input name="password" type="password" value={form.password} onChange={update} autoComplete="new-password" className="input pl-10" placeholder={`At least ${MIN_PASSWORD} characters`} />
              </span>
            </label>
            <label className="block text-xs font-bold text-slate-600">Confirm password
              <input name="confirm" type="password" value={form.confirm} onChange={update} autoComplete="new-password" className="input mt-2" placeholder="Repeat your password" />
            </label>
            <label className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <input name="terms" type="checkbox" checked={form.terms} onChange={update} className="mt-1 accent-primary" /> I agree to the Terms of Service and Privacy Policy.
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? <><Loader2 size={17} className="animate-spin" /> Creating account…</> : <>Create account <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" state={location.state} className="font-extrabold text-primary-600">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

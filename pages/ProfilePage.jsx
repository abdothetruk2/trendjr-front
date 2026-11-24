import { Link, useNavigate } from "react-router-dom";
import { UserRound, Package, Heart, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import { ProfileForm, AddressForm, PasswordForm } from "../src/components/account/AccountForms";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/");
  }

  const links = [
    { to: "/orders", label: "My orders", icon: Package },
    { to: "/wishlist", label: "My wishlist", icon: Heart },
    { to: "/cart", label: "Shopping cart", icon: ShoppingBag },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin dashboard", icon: LayoutDashboard }] : []),
  ];

  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mb-8">
          <p className="eyebrow">Your personal space</p>
          <h1 className="mt-2 text-3xl font-black text-secondary">My account</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your profile and account information.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="card h-fit p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-50 text-xl font-extrabold uppercase text-primary-600">
                {(user?.username || user?.email || "?").charAt(0) || <UserRound size={26} />}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-extrabold text-secondary">{user?.username || "My account"}</h2>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <nav className="mt-6 space-y-1 text-sm" aria-label="Account">
              <span className="block rounded-xl bg-primary-50 px-4 py-3 font-bold text-primary-700" aria-current="page">Personal information</span>
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-50">
                  <Icon size={16} className="text-slate-400" aria-hidden="true" /> {label}
                </Link>
              ))}
              <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-rose-500 hover:bg-rose-50">
                <LogOut size={16} aria-hidden="true" /> Sign out
              </button>
            </nav>
          </aside>
          <div className="space-y-6">
            <ProfileForm title="Personal information" description="Update your contact details." />
            <AddressForm />
            <PasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}

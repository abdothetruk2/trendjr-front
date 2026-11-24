import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-[60vh] bg-surface py-16">
      <div className="container-page">
        <div className="card mx-auto max-w-lg p-8 text-center sm:p-10">
          <SearchX className="mx-auto h-12 w-12 text-primary-400" aria-hidden="true" />
          <p className="eyebrow mt-4">Error 404</p>
          <h1 className="mt-2 text-2xl font-black text-secondary">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">
              <Home size={17} /> Back to home
            </Link>
            <Link to="/shop" className="btn-outline">
              Browse products
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

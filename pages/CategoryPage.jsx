import { ArrowRight, Star } from "lucide-react";

export default function CategoryPage() {
  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-secondary px-7 py-12 text-white sm:px-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(249,77,28,0.35),transparent_60%)] md:block" />
          <p className="eyebrow !text-orange-200">Explore collection</p>
          <h1 className="mt-2 text-4xl font-black">Electronics</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            Smart devices and everyday technology chosen to keep you connected,
            productive, and entertained.
          </p>
          <span className="mt-5 inline-flex rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">
            38 products available
          </span>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-secondary">
            Popular in Electronics
          </h2>
          <a href="/products" className="link-primary text-sm">
            Browse all products <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <article className="card group overflow-hidden">
            <a href="/product">
              <div className="h-52 bg-white p-4">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                  alt="Headphones"
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
            </a>
            <div className="p-4">
              <p className="text-xs text-slate-400">Audio</p>
              <a
                href="/product"
                className="mt-1 block font-bold text-secondary"
              >
                Wireless Headphones
              </a>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.7</span>
              </div>
              <strong className="mt-3 block text-lg text-primary-600">
                $64.00
              </strong>
            </div>
          </article>
          <article className="card group overflow-hidden">
            <a href="/product">
              <div className="h-52 bg-white p-4">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                  alt="Smart watch"
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
            </a>
            <div className="p-4">
              <p className="text-xs text-slate-400">Wearables</p>
              <a
                href="/product"
                className="mt-1 block font-bold text-secondary"
              >
                Smart Everyday Watch
              </a>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.8</span>
              </div>
              <strong className="mt-3 block text-lg text-primary-600">
                $49.00
              </strong>
            </div>
          </article>
          <article className="card group overflow-hidden">
            <a href="/product">
              <div className="h-52 bg-white p-4">
                <img
                  src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80"
                  alt="Camera"
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
            </a>
            <div className="p-4">
              <p className="text-xs text-slate-400">Cameras</p>
              <a
                href="/product"
                className="mt-1 block font-bold text-secondary"
              >
                Instant Compact Camera
              </a>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.5</span>
              </div>
              <strong className="mt-3 block text-lg text-primary-600">
                $89.00
              </strong>
            </div>
          </article>
          <article className="card group overflow-hidden">
            <a href="/product">
              <div className="h-52 bg-white p-4">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"
                  alt="Phone"
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
            </a>
            <div className="p-4">
              <p className="text-xs text-slate-400">Mobile</p>
              <a
                href="/product"
                className="mt-1 block font-bold text-secondary"
              >
                Modern Smartphone
              </a>
              <div className="mt-2 flex items-center gap-1 text-amber-400">
                <Star size={13} fill="currentColor" />
                <span className="text-xs text-slate-500">4.9</span>
              </div>
              <strong className="mt-3 block text-lg text-primary-600">
                $299.00
              </strong>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

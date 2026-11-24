import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  Zap,
  CreditCard,
} from "lucide-react";
import { PRODUCTS } from '../src/data/products'

export default function ProductPage() {


  console.log(PRODUCTS)
  return (
    <main className="min-h-screen bg-surface py-6 sm:py-10">
      <div className="container-page">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <a href="/" className="hover:text-primary-500">
            Home
          </a>
          <ChevronRight size={15} />
          <a href="/products" className="hover:text-primary-500">
            Products
          </a>
          <ChevronRight size={15} />
          <span className="font-medium text-secondary">Product details</span>
        </nav>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <span className="absolute left-5 top-5 z-10 rounded-xl bg-primary-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg">
                25% OFF
              </span>
              <span className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-500 shadow-md">
                <Heart size={21} />
              </span>
              <div className="flex h-[380px] items-center justify-center bg-gradient-to-br from-white to-orange-50/60 p-8 sm:h-[500px]">
                <img
                  src="/product.jpg"
                  alt="Portable wireless product"
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="h-24 rounded-2xl border-2 border-primary-500 bg-white p-2">
                <img
                  src="/product.jpg"
                  alt="Product view 1"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="h-24 rounded-2xl border border-slate-200 bg-white p-2">
                <img
                  src="/product.jpg"
                  alt="Product view 2"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="h-24 rounded-2xl border border-slate-200 bg-white p-2">
                <img
                  src="/product.jpg"
                  alt="Product view 3"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="h-24 rounded-2xl border border-slate-200 bg-white p-2">
                <img
                  src="/product.jpg"
                  alt="Product view 4"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">
                Electronics & Gadgets
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={14} /> Verified product
              </span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-secondary sm:text-4xl">
              Portable Wireless Massage Wand
            </h1>
            <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-amber-400">
                ★★★★★
              </span>
              <strong className="text-sm text-secondary">4.8</strong>
              <span className="text-sm text-slate-400">128 reviews</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">350+ sold</span>
            </div>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <strong className="text-3xl font-black text-primary-600">
                  $29.99
                </strong>
                <span className="text-lg text-slate-400 line-through">
                  $39.99
                </span>
                <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-600">
                  -25%
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                Save $10.00 on this product
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={17} /> In stock — ready to ship
              </div>
            </div>
            <div className="mb-6">
              <h3 className="mb-3 font-bold text-secondary">
                Select color{" "}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  Black
                </span>
              </h3>
              <div className="flex gap-3">
                <span className="h-10 w-10 rounded-full bg-slate-900 ring-2 ring-primary-500 ring-offset-2" />
                <span className="h-10 w-10 rounded-full bg-red-500" />
                <span className="h-10 w-10 rounded-full bg-blue-500" />
                <span className="h-10 w-10 rounded-full bg-amber-400" />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="mb-3 font-bold text-secondary">Select size</h3>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                  S
                </span>
                <span className="rounded-xl bg-primary-500 px-4 py-3 text-sm font-bold text-white">
                  M
                </span>
                <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                  L
                </span>
                <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                  XL
                </span>
                <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                  XXL
                </span>
              </div>
            </div>
            <div className="mb-7">
              <h3 className="mb-3 font-bold text-secondary">Quantity</h3>
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <span className="px-4 py-3 text-slate-400">−</span>
                <strong className="border-x border-slate-200 px-5 py-3 text-secondary">
                  1
                </strong>
                <span className="px-4 py-3 text-slate-400">+</span>
              </div>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <a
                href="/cart"
                className="btn-primary rounded-2xl py-4 text-sm sm:text-base"
              >
                <ShoppingBag size={19} /> Add to cart
              </a>
              <a
                href="/checkout"
                className="btn-outline rounded-2xl py-4 text-sm sm:text-base"
              >
                Buy now <ChevronRight size={18} />
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-6">
              <div className="text-center">
                <Truck className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">
                  Fast shipping
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Order tracking
                </p>
              </div>
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">
                  Buyer protection
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Secure purchase
                </p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-bold text-secondary">Easy returns</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Simple process
                </p>
              </div>
            </div>
          </div>
        </div>
        <section className="card mt-12 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-secondary">
            Product description
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-600">
            Discover a convenient and comfortable way to relax with this
            portable wireless product. Designed with a modern, compact form, it
            is easy to carry and suitable for everyday use. Replace this sample
            description with the supplier's verified product details before
            publishing.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="tile flex items-center gap-3 p-4">
              <Zap className="text-primary-500" />
              <strong className="text-slate-700">Wireless design</strong>
            </div>
            <div className="tile flex items-center gap-3 p-4">
              <PackageCheck className="text-primary-500" />
              <strong className="text-slate-700">Compact & portable</strong>
            </div>
            <div className="tile flex items-center gap-3 p-4">
              <CreditCard className="text-primary-500" />
              <strong className="text-slate-700">Secure checkout</strong>
            </div>
          </div>
        </section>
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">You may also like</p>
              <h2 className="mt-2 text-2xl font-black text-secondary">
                Related products
              </h2>
            </div>
            <a href="/products" className="link-primary text-sm">
              View all
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <a href="/product" className="card overflow-hidden p-3">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80"
                alt="Headphones"
                className="h-36 w-full object-contain"
              />
              <p className="mt-2 text-sm font-bold text-secondary">
                Wireless Headphones
              </p>
              <strong className="mt-1 block text-primary-600">$64.00</strong>
            </a>
            <a href="/product" className="card overflow-hidden p-3">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80"
                alt="Watch"
                className="h-36 w-full object-contain"
              />
              <p className="mt-2 text-sm font-bold text-secondary">
                Classic Watch
              </p>
              <strong className="mt-1 block text-primary-600">$49.00</strong>
            </a>
            <a href="/product" className="card overflow-hidden p-3">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80"
                alt="Sneakers"
                className="h-36 w-full object-contain"
              />
              <p className="mt-2 text-sm font-bold text-secondary">
                Sport Sneakers
              </p>
              <strong className="mt-1 block text-primary-600">$58.50</strong>
            </a>
            <a href="/product" className="card overflow-hidden p-3">
              <img
                src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80"
                alt="Camera"
                className="h-36 w-full object-contain"
              />
              <p className="mt-2 text-sm font-bold text-secondary">
                Compact Camera
              </p>
              <strong className="mt-1 block text-primary-600">$89.00</strong>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

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
  BadgePercent,
  CreditCard,
} from "lucide-react";

export default function ProductPage({product}) {
  return (
    <main id={product.id} className="min-h-screen bg-surface py-6 sm:py-10">

      <div className="container-page">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <a href="/" className="hover:text-primary-500">Home</a>
          <ChevronRight size={15} />
          <a href="/products" className="hover:text-primary-500">Products</a>
          <ChevronRight size={15} />
          <span className="text-slate-800 font-medium">Product Details</span>
        </nav>


        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT - Images */}
          <div>

            {/* Main Image */}
            <div className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden group">

              {/* Discount */}
              <span className="absolute top-5 left-5 z-10 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-extrabold shadow-lg shadow-primary-500/20">
                25% OFF
              </span>

              {/* Wishlist */}
              <button
                type="button"
                aria-label="Add to wishlist"
                className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-primary-500 transition"
              >
                <Heart size={21} />
              </button>

              {/* Product Image */}
              <div className="h-[380px] sm:h-[500px] flex items-center justify-center p-8 bg-gradient-to-br from-white via-white to-orange-50/50">

                <img
                  src="/product.jpg"
                  alt="Portable Wireless Massage Wand"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />

              </div>

              {/* Image Label */}
              <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-md rounded-lg px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                Product Image
              </div>

            </div>


            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3 mt-4">

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-24 sm:h-28 rounded-2xl overflow-hidden border-2 cursor-pointer bg-white p-2
                    ${item === 1
                      ? "border-primary-500"
                      : "border-slate-200 hover:border-primary-300"
                    }`}
                >
                  <img
                    src="/product.jpg"
                    alt={`Product view ${item}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}

            </div>

          </div>


          {/* RIGHT - Details */}
          <div>

            {/* Category */}
            <div className="flex items-center gap-2 mb-4">

              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
                Electronics & Gadgets
              </span>

              <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <CheckCircle2 size={14} />
                Verified Product
              </span>

            </div>


            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-secondary leading-tight mb-4">
              Portable Wireless Massage Wand
            </h1>


            {/* Rating */}
            <div className="flex flex-wrap items-center gap-3 mb-6">

              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={17} fill="currentColor" />
                ))}
              </div>

              <span className="font-bold text-slate-800 text-sm">
                4.8
              </span>

              <span className="text-slate-400 text-sm">
                (128 reviews)
              </span>

              <span className="text-slate-300">|</span>

              <span className="text-sm text-slate-500">
                350+ sold
              </span>

            </div>


            {/* Price Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">

              <div className="flex items-center gap-3 mb-2">

                <span className="text-3xl font-extrabold text-primary-600">
                  $29.99
                </span>

                <span className="text-lg text-slate-400 line-through">
                  $39.99
                </span>

                <span className="bg-red-50 text-red-600 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                  -25%
                </span>

              </div>

              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                <BadgePercent size={17} />
                You save $10.00 on this product
              </p>

              <div className="border-t border-slate-100 mt-4 pt-4 flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <CheckCircle2 size={17} />
                In Stock - Ready to ship
              </div>

            </div>


            {/* Colors */}
            <div className="mb-6">

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-secondary">
                  Select Color
                </h3>

                <span className="text-xs text-slate-400">
                  Black selected
                </span>
              </div>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  aria-label="Black"
                  className="w-10 h-10 rounded-full bg-slate-900 ring-2 ring-primary-500 ring-offset-2"
                />

                <button
                  type="button"
                  aria-label="Red"
                  className="w-10 h-10 rounded-full bg-red-500 border-2 border-white shadow-sm"
                />

                <button
                  type="button"
                  aria-label="Blue"
                  className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white shadow-sm"
                />

                <button
                  type="button"
                  aria-label="Yellow"
                  className="w-10 h-10 rounded-full bg-amber-400 border-2 border-white shadow-sm"
                />

              </div>

            </div>


            {/* Sizes */}
            <div className="mb-7">

              <div className="flex items-center justify-between mb-3">

                <h3 className="font-bold text-secondary">
                  Select Size
                </h3>

                <button type="button" className="text-xs text-primary-600 font-bold">
                  Size Guide
                </button>

              </div>

              <div className="flex flex-wrap gap-2">

                {["S", "M", "L", "XL", "XXL"].map((size, index) => (
                  <button
                    type="button"
                    key={size}
                    className={`min-w-12 h-11 px-4 rounded-xl font-bold text-sm border transition
                      ${index === 1
                        ? "bg-primary-500 border-primary-500 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-primary-500 hover:text-primary-600"
                      }`}
                  >
                    {size}
                  </button>
                ))}

              </div>

            </div>


            {/* Quantity */}
            <div className="mb-7">

              <h3 className="font-bold text-secondary mb-3">
                Quantity
              </h3>

              <div className="flex items-center justify-between">

                <div className="flex items-center border border-slate-200 rounded-xl bg-white">

                  <button type="button" className="px-4 py-3 text-slate-500 hover:text-primary-500 font-bold">
                    −
                  </button>

                  <span className="px-4 font-bold text-secondary border-x border-slate-200 py-3">
                    1
                  </span>

                  <button type="button" className="px-4 py-3 text-slate-500 hover:text-primary-500 font-bold">
                    +
                  </button>

                </div>

                <span className="text-xs text-slate-400">
                  Limited stock available
                </span>

              </div>

            </div>


            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">

              <button
                type="button"
                className="btn-primary py-4 rounded-2xl text-sm sm:text-base shadow-lg shadow-primary-500/20"
              >
                <ShoppingBag size={19} />
                Add To Cart
              </button>

              <button
                type="button"
                className="btn-outline py-4 rounded-2xl text-sm sm:text-base"
              >
                Buy Now
                <ChevronRight size={18} />
              </button>

            </div>


            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-6">

              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
                  <Truck size={20} />
                </div>

                <p className="text-xs font-bold text-secondary">
                  Fast Shipping
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  Track your order
                </p>
              </div>


              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck size={20} />
                </div>

                <p className="text-xs font-bold text-secondary">
                  Buyer Protection
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  Secure purchase
                </p>
              </div>


              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2">
                  <RotateCcw size={20} />
                </div>

                <p className="text-xs font-bold text-secondary">
                  Easy Returns
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  Shop with confidence
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* Product Description */}
        <section className="mt-12">

          <div className="card p-6 sm:p-8">

            <h2 className="text-xl sm:text-2xl font-extrabold text-secondary mb-5">
              Product Description
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-8 max-w-4xl">
              Discover a convenient and comfortable way to relax with our
              Portable Wireless Massage Wand. Designed with a modern and
              compact form, it is easy to carry and suitable for everyday use.
              Its wireless design provides flexibility and convenience
              wherever you need it.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-7">

              <div className="tile flex items-center gap-3 p-4">
                <Zap className="text-primary-500" size={22} />
                <span className="font-bold text-slate-700">
                  Wireless Design
                </span>
              </div>

              <div className="tile flex items-center gap-3 p-4">
                <PackageCheck className="text-primary-500" size={22} />
                <span className="font-bold text-slate-700">
                  Compact & Portable
                </span>
              </div>

              <div className="tile flex items-center gap-3 p-4">
                <CreditCard className="text-primary-500" size={22} />
                <span className="font-bold text-slate-700">
                  Secure Checkout
                </span>
              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
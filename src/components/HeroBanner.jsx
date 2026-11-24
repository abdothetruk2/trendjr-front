
import React from "react";
import {
  ShieldCheck,
  Truck,
  Globe,
  ShoppingCart,
  MapPin,
  ShoppingBag,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: "فحص المنتجات",
    subtitle: "قبل الشحن",
  },
  {
    icon: Truck,
    title: "شحن موثوق",
    subtitle: "",
  },
  {
    icon: Globe,
    title: "أحدث",
    subtitle: "المنتجات العالمية",
  },
  {
    icon: ShoppingCart,
    title: "تسوق بسهولة",
    subtitle: "وأمان",
  },
];

export default function HeroBanner({
  backgroundImage = "./src/ab.jpeg",
  onShopNow,
  onBrowseOffers,
}) {
  return (
    <section
      dir="ltr"
      className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl bg-[#f8f2fa] shadow-2xl ring-1 ring-purple-900/10"
    >
      {/* طبقة الخلفية (الصورة الثانية المحسنة في Element مستقل) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        <img
          src={backgroundImage}
          alt="خلفية منتجات Trend GR"
          className="h-full w-full scale-[1.03] object-cover object-[85%_center] transition-transform duration-700 md:object-right"
        />

        {/* تدرّج جانبي ناعم لعزل الجزء الأيسر وإبراز النصوص والأزرار */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbf7fd] via-[#fbf7fd]/85 to-transparent sm:via-[#fbf7fd]/70 lg:w-[58%] lg:via-[#fbf7fd]/60" />

        {/* تدرّج سفلي لإخفاء الأجزاء الأمامية السفلية وإبراز شريط المميزات */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#2c093e]/35 via-[#f8f2fa]/50 to-transparent" />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex min-h-[460px] flex-col justify-between px-5 pt-8 pb-5 sm:px-8 sm:pt-10 lg:min-h-[520px] lg:px-12 lg:pt-12 lg:pb-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* العمود الأيسر: الشعار والنصوص والأزرار */}
          <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-center">
            {/* الشعار */}
            <div className="mb-2 flex flex-col items-center">
              <svg
                viewBox="0 0 120 110"
                className="h-20 w-20 drop-shadow-sm sm:h-24 sm:w-24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M44 34C44 17 55 8 68 10C79 12 84 22 83 34"
                  stroke="#7A1CA4"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M28 36H76C74 52 67 63 54 70C68 74 78 86 80 100C65 92 48 80 34 74C24 69 20 61 23 50L28 36Z"
                  fill="url(#trendPurple)"
                />
                <path
                  d="M84 30C85 50 93 58 112 61C93 64 85 72 84 92C83 72 75 64 56 61C75 58 83 50 84 30Z"
                  fill="#8AC926"
                />
                <defs>
                  <linearGradient
                    id="trendPurple"
                    x1="20"
                    y1="36"
                    x2="80"
                    y2="100"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#8E24AA" />
                    <stop offset="1" stopColor="#4A0E6E" />
                  </linearGradient>
                </defs>
              </svg>

              <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[#4D0F6B] sm:text-5xl">
                trend <span className="font-bold">gr</span>
              </h1>
            </div>

            {/* شارة العنوان الرئيسي */}
            <div
              dir="rtl"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[#5B107D] to-[#410A5B] px-6 py-2.5 text-lg font-bold text-white shadow-lg shadow-purple-900/25 sm:text-2xl"
            >
              <span>أحدث المنتجات الرائجة</span>
            </div>

            {/* النص الفرعي */}
            <p
              dir="rtl"
              className="mt-3 text-base font-bold text-[#4D0F6B] sm:text-xl"
            >
              كل جديد ومميز في مكان واحد
            </p>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-[#8AC926]" />

            {/* الأزرار التفاعلية */}
            <div
              dir="rtl"
              className="mt-6 flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto"
            >
              <button
                type="button"
                onClick={onShopNow}
                className="group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gradient-to-l from-[#6B1594] to-[#4A0E6E] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#7A1CA4] hover:to-[#5B107D] hover:shadow-xl active:scale-95 sm:text-base"
              >
                <ShoppingBag className="h-4 w-4 text-[#A7E642]" />
                <span>تسوق الآن</span>
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onBrowseOffers}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#5B107D]/25 bg-white/85 px-6 py-3 text-sm font-bold text-[#4D0F6B] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8AC926] hover:bg-white active:scale-95 sm:text-base"
              >
                <Sparkles className="h-4 w-4 text-[#8AC926]" />
                <span>تصفح العروض</span>
              </button>
            </div>

          </div>

          {/* مساحة لإظهار منتجات الخلفية */}
          <div className="hidden lg:col-span-7 lg:block" />
        </div>

        {/* الشريط السفلي */}
        <div className="mt-8 rounded-2xl bg-white/95 p-3 shadow-xl shadow-purple-950/15 ring-1 ring-purple-900/10 backdrop-blur-md lg:mt-10 lg:rounded-full lg:px-5 lg:py-2.5">
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row lg:gap-2">
            {/* عناصر الثقة والشحن */}
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-1 lg:items-center lg:justify-around lg:gap-0 lg:divide-x lg:divide-purple-900/15">
              {TRUST_FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    dir="rtl"
                    className="flex items-center justify-center gap-2.5 px-2 py-1 lg:px-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[#5B107D]">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="text-right leading-tight">
                      <p className="text-xs font-extrabold text-[#4A0E6E] sm:text-sm">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs font-bold text-[#4A0E6E]/90 sm:text-sm">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* شارة العنوان */}
            <a
              href="https://maps.google.com/?q=Münsterstraße+11,+49525+Lengerich"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5B107D] to-[#4A0E6E] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:from-[#6D1796] hover:to-[#5B107D] hover:shadow-lg sm:text-sm lg:w-auto"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#8AC926] transition-transform duration-200 group-hover:scale-110" />
              <span className="tracking-wide">
                Münsterstraße 11, 49525 Lengerich
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
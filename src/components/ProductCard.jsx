import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';

export default function ProductCard({
  product,
  cat_id,
  filter,
  language = 'en',
  onAddToCart,
  onToggleWishlist
}) {

  // =====================================
  // 1. Check Product
  // =====================================

  if (!product) return null;


  // =====================================
  // 2. Helpers
  // =====================================

  // Get localized text
  const getText = (value) => {

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (value && typeof value === 'object') {
      return (
        value[language] ||
        value.en ||
        value.ar ||
        value.de ||
        ''
      );
    }

    return '';
  };


  // Convert values to numbers safely
  const getNumber = (value) => {

    const number = Number(value ?? 0);

    return Number.isFinite(number) ? number : 0;
  };


  // Format prices
  const formatPrice = (price) => {

    return getNumber(price).toFixed(2);

  };


  // Format numbers
  const formatNumber = (number) => {

    return getNumber(number).toLocaleString();

  };


  // Get ID from populated MongoDB objects or strings
  const getId = (value) => {

    if (value && typeof value === 'object') {

      return (
        value._id ||
        value.id ||
        value.slug ||
        ''
      );

    }

    return value ?? '';

  };


  // =====================================
  // 3. Product Data
  // =====================================

  const productId = product._id || product.id;

  const title = getText(product.title || product.name);

  const image =
    typeof product.image === 'string'
      ? product.image
      : product.image?.url ||
        product.images?.[0]?.url ||
        product.images?.[0] ||
        '';

  const price = getNumber(product.price);

  const originalPrice = getNumber(product.originalPrice);

  const discount = getNumber(product.discount);

  const rating = getNumber(product.rating);

  const reviewsCount = getNumber(product.reviewsCount);

  const sold = getNumber(product.sold);


  // =====================================
  // 4. Category Filtering
  // =====================================

  const selectedCategory = cat_id ?? filter;

  const productCategory = getId(product.category);

  const productFilter = getId(product.filter);

  const matchesCategory =
    !selectedCategory ||
    selectedCategory === 'all' ||
    String(productCategory) === String(selectedCategory) ||
    String(productFilter) === String(selectedCategory);

  // Don't render product if category doesn't match
  if (!matchesCategory) return null;


  // =====================================
  // 5. Product URL
  // =====================================

  const productUrl = `/product/${productId}`;


  // =====================================
  // 6. Render
  // =====================================

  return (

    <div className="
      group bg-white rounded-2xl
      border border-slate-200/80
      hover:border-primary-300
      hover:shadow-soft
      overflow-hidden
      flex flex-col
      transition-all duration-200
    ">


      {/* =====================================
          PRODUCT IMAGE
      ====================================== */}

      <div className="
        relative aspect-[4/3] h-[250px]
        bg-slate-100 overflow-hidden
      ">

        <Link to={productUrl}>

          {image ? (

            <img
              src={"/"+image}
              alt={title}
              loading="lazy"
              className="
                product-img
                w-full h-full
                object-cover
                transition-transform duration-300
                group-hover:scale-105
              "
            />

          ) : (

            <div className="
              w-full h-full
              flex items-center justify-center
              text-slate-400
            ">
              No Image
            </div>

          )}

        </Link>


        {/* BADGES */}

        <div className="
          absolute top-2.5 left-2.5
          flex flex-wrap gap-1.5
        ">

          {discount > 0 && (

            <span className="badge-primary">

              -{discount}% OFF

            </span>

          )}

          {product.isNew && (

            <span className="badge-secondary">

              NEW

            </span>

          )}

        </div>


        {/* WISHLIST BUTTON */}

        <button
          type="button"
          onClick={() => onToggleWishlist?.(product)}
          className="
            btn-wish
            absolute top-2.5 right-2.5
            w-8 h-8
          "
          aria-label="Save to wishlist"
        >

          <Heart className="w-4 h-4 text-slate-600" />

        </button>

      </div>


      {/* =====================================
          PRODUCT DETAILS
      ====================================== */}

      <div className="
        p-3.5 flex-1
        flex flex-col
        justify-between
      ">


        {/* PRODUCT TITLE */}

        <div>

          <Link to={productUrl}>

            <h3 className="
              mt-1
              text-left text-sm
              font-bold text-slate-900
              line-clamp-2
              hover:text-primary-600
              leading-snug
              cursor-pointer
            ">

              {title || 'Unnamed Product'}

            </h3>

          </Link>


          {/* =====================================
              RATING & SALES
          ====================================== */}

          <div className="
            mt-2 flex items-center
            gap-1.5 text-muted
          ">


            {/* RATING */}

            <span className="
              inline-flex items-center gap-0.5
              font-bold text-slate-800
            ">

              <Star className="
                w-3.5 h-3.5
                fill-amber-400
                text-amber-400
              " />

              {rating.toFixed(1)}

            </span>


            {/* REVIEWS */}

            <span>

              ({formatNumber(reviewsCount)})

            </span>


            <span>·</span>


            {/* SOLD */}

            <span>

              {formatNumber(sold)} sold

            </span>

          </div>

        </div>


        {/* =====================================
            PRICE & CART
        ====================================== */}

        <div className="
          mt-3 pt-3
          border-t border-slate-100
          flex items-center
          justify-between gap-2
        ">


          {/* PRICE */}

          <div>

            <div className="
              flex items-baseline gap-1.5
            ">


              {/* CURRENT PRICE */}

              <span className="
                text-lg font-extrabold
                text-slate-950
              ">

                ${formatPrice(price)}

              </span>


              {/* ORIGINAL PRICE */}

              {originalPrice > price && (

                <span className="
                  price-old text-xs
                ">

                  ${formatPrice(originalPrice)}

                </span>

              )}

            </div>


            {/* DISCOUNT INFO */}

            {originalPrice > price && (

              <div className="
                flex items-center gap-1
                text-[11px]
                font-semibold
                text-emerald-600
                mt-0.5
              ">

                Save ${formatPrice(originalPrice - price)}

              </div>

            )}

          </div>


          {/* =====================================
              ADD TO CART
          ====================================== */}

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="
              btn-light p-2.5
              hover:bg-primary-500
              hover:text-white
              transition-colors
            "
            aria-label={`Add ${title} to cart`}
          >

            <ShoppingCart className="w-4 h-4" />

          </button>

        </div>

      </div>

    </div>

  );

} 
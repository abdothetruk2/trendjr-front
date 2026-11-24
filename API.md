# Trend Jr API

Base URL: `http://localhost:3000/api` (port comes from `PORT` in `.env`, default `3000`)

All request and response bodies are JSON.

## Authentication

Protected routes need a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

You get a token from `POST /auth/register` or `POST /auth/login`. Tokens expire after `JWT_EXPIRES_IN` (default `1h`).

Access levels used below:

| Level    | Meaning                                        |
| -------- | ---------------------------------------------- |
| Public   | No token needed                                |
| User     | Any logged-in user                             |
| Admin    | Logged-in user with `role: "admin"`            |

> Registration always creates a `user`. To make the first admin, register the account on the
> website, then run `npm run make-admin -- <username or email>` in the backend folder.
> After that, admins can grant or remove admin access from the dashboard (`PATCH /admin/customers/:id`).
>
> The role is read from the database on every request (not from the token), so a role change or a
> block takes effect immediately.

## Lists, pagination and totals

Paginated lists take `?page=` (from 1) and `?limit=` (default 20, max 100) and send the total
number of matches in the `X-Total-Count` response header (exposed to the browser through CORS).
The body is always the plain array of items.

## Errors

Every error returns a JSON body with a `message`:

```json
{ "message": "Product not found" }
```

| Status | When                                                   |
| ------ | ------------------------------------------------------ |
| 400    | Missing/invalid fields, invalid id or filter value     |
| 401    | No token, bad/expired token, wrong credentials         |
| 403    | Not an admin, not the owner of the order, or the account is blocked |
| 404    | Resource or route not found                            |
| 409    | Duplicate value (e.g. username, email, slug already used), or a delete that would break other data |
| 413    | Upload larger than 5 MB                                |
| 415    | Upload that is not a JPEG, PNG, WebP or GIF image      |
| 429    | Too many failed sign-ins from this address (10 within 15 minutes) |
| 500    | Server error (the message is always just `Server error`; details go to the server log) |

---

## Auth — `/api/auth`

| Method | Path                  | Access | Description                    |
| ------ | --------------------- | ------ | ------------------------------ |
| POST   | `/auth/register`      | Public | Create an account              |
| POST   | `/auth/login`         | Public | Log in                         |
| POST   | `/auth/logout`        | User   | Log out                        |
| GET    | `/auth/me`            | User   | Get the current user           |
| PATCH  | `/auth/me`            | User   | Update own email / phone       |
| POST   | `/auth/resetPassword` | User   | Change the current user's password |

`username`, `email`, `password` and `phone` must be text: anything else (e.g. an object such as
`{ "$ne": null }`) is refused with **400**.

### POST `/auth/register`

```json
{
  "username": "ahmed",
  "email": "ahmed@example.com",
  "password": "secret123",
  "phone": "0100000000"
}
```

`username`, `email`, `password` are required. `password` must be at least 8 characters. `phone` is optional.

**201**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "665f...",
    "username": "ahmed",
    "email": "ahmed@example.com",
    "phone": "0100000000",
    "role": "user",
    "addresses": []
  }
}
```

### POST `/auth/login`

```json
{ "username": "ahmed", "password": "secret123" }
```

**200** — same shape as register: `{ token, user }`.
**401** — `Invalid username or password`.
**403** — `This account has been blocked`.
**429** — too many failed attempts from this address; try again later.

### POST `/auth/logout`

No body. **200** — `{ "message": "Logged out" }`

> This marks the user inactive but does not revoke the token. The client should delete its stored token.

### GET `/auth/me`

**200** — `{ "user": { id, username, email, phone, role, addresses } }`

### PATCH `/auth/me`

```json
{ "email": "new@example.com", "phone": "+20 100 000 0000" }
```

Both fields are optional; send `""` as `phone` to remove it.
**200** — `{ "user": { ... } }` · **400** — invalid email/phone · **409** — email used by another account.

### POST `/auth/resetPassword`

Changes the password of the logged-in user (this is not a "forgot password" flow).

```json
{ "currentPassword": "secret123", "newPassword": "newSecret456" }
```

**200** — `{ "message": "Password updated" }`
**400** — `Current password is incorrect` (400, not 401: the session itself is still valid).

---

## Products — `/api/products`

Products are looked up by their **numeric `id`** (e.g. `/products/12`), not the MongoDB `_id`.

| Method       | Path              | Access | Description                     |
| ------------ | ----------------- | ------ | ------------------------------- |
| GET          | `/products`       | Public | List active products            |
| GET          | `/products/flash` | Public | List active flash-sale products |
| GET          | `/products/:id`   | Public | Get one active product (hidden products: **404**) |
| POST         | `/products`       | Admin  | Create a product                |
| PUT / PATCH  | `/products/:id`   | Admin  | Update a product                |
| DELETE       | `/products/:id`   | Admin  | Delete a product                |

### GET `/products`

Optional query params:

| Param        | Example                  | Description                                    |
| ------------ | ------------------------ | ---------------------------------------------- |
| `brand`      | `?brand=Nivea`           | Exact brand match                              |
| `featured`   | `?featured=true`         | `true` or `false`                              |
| `search`     | `?search=cream`          | Case-insensitive match on name (en/de/ar) or brand |
| `category`   | `?category=home-kitchen` | Category slug, numeric `id` or `_id`. Matches products of that category or one of its sub-categories: products whose `category` field is the slug (set from the dashboard) or that are tagged `category-request:<slug>` (imported data). Unknown category → empty list |
| `discounted` | `?discounted=true`       | Only products with `discount > 0`              |
| `maxPrice`   | `?maxPrice=25`           | Only products with `price <= maxPrice` (**400** if not a number) |
| `sort`       | `?sort=price-asc`        | `newest`, `popular`, `rating`, `discount`, `price-asc`, `price-desc` (default: by `id`) |
| `page`       | `?page=2`                | Page number, starts at 1                       |
| `limit`      | `?limit=20`              | Page size, default 20, max 100                 |

**200** — array of products, sorted by `id` unless `sort` is given.

Pagination is opt-in: without `page`/`limit` the full list is returned (unchanged behavior).
With them, only that page is returned and the total number of matching products is sent in
the `X-Total-Count` response header (exposed to the browser through CORS).

### Product object

```json
{
  "id": 12,
  "slug": "face-cream-50ml",
  "sku": "FC-050",
  "brand": "Nivea",
  "name": { "en": "Face Cream", "de": "Gesichtscreme", "ar": "كريم وجه" },
  "description": { "en": "...", "de": "...", "ar": "..." },
  "price": "4.99",
  "old_price": "6.99",
  "discount": 28,
  "rating": "4.5",
  "reviews_count": 10,
  "stock": 50,
  "image": "https://...",
  "images": ["https://...", "media/photo-2.jpg"],
  "category": "skin-care",
  "tags": ["category-request:skin-care", "..."],
  "featured": false,
  "flash_sale": true,
  "reward_points": 5,
  "is_active": true,
  "created_at": "2026-11-23T20:00:00.000Z",
  "updated_at": "2026-11-23T20:00:00.000Z"
}
```

Note: `price`, `old_price` and `rating` are **strings**.
`category` is only present on products whose category was set through the API; imported products
use the `category-request:<slug>` tag. `images` (extra gallery photos shown after `image`) is only
present on products that have more than one photo. `tags` is either a list of texts or an object with import details.

### POST `/products`

Body: fields from the product object above. Validation:

| Field | Rule |
| ----- | ---- |
| `name` | required: text or `{ en, de, ar }` with a non-empty `en` (max 200 characters) |
| `price` | required number, 0 – 1,000,000 (stored as a string with 2 decimals) |
| `old_price` | number ≥ 0 or `null` |
| `discount` | whole number 0 – 100; computed from `old_price` when omitted |
| `stock`, `reviews_count`, `reward_points` | whole numbers ≥ 0 |
| `rating` | number 0 – 5 |
| `slug` | lowercase letters, numbers and single hyphens; generated from the English name when omitted |
| `sku` | optional, unique, max 64 characters |
| `image` | an `http(s)://` URL, or a `media/…` or `uploads/…` path |
| `images` | list of up to 12 extra photos, each like `image` (empty entries and repeats are dropped); `[]` or `null` removes them |
| `category` | slug of an existing category, or `null` |
| `featured`, `flash_sale`, `is_active` | `true` / `false` |

`id` is optional — if omitted, the next free number is used.

**201** — the created product. **400** — the first invalid field, e.g. `price must be a number`.

### PUT / PATCH `/products/:id`

Body: only the fields you want to change (`id` cannot be changed). Both methods behave the same (partial update).
For `name` / `description`, only the languages you send are changed (other translations are kept).
Sending `category` also removes the product's imported `category-request:` tags, so it doesn't stay in its old category.
`sku: ""` removes the SKU.

**200** — the updated product.
**400** — `No valid fields to update` if the body has no known fields, or a validation message.

### DELETE `/products/:id`

Orders keep their own copy of name, price and image, so order history is not affected.

**200** — `{ "message": "Product deleted", "id": 12 }`

---

## Categories — `/api/categories`

Categories are looked up by MongoDB `_id`.

| Method       | Path                | Access | Description             |
| ------------ | ------------------- | ------ | ----------------------- |
| GET          | `/categories`       | Public | List active categories  |
| GET          | `/categories/:id`   | Public | Get one category        |
| POST         | `/categories`       | Admin  | Create a category       |
| PUT / PATCH  | `/categories/:id`   | Admin  | Update a category       |
| DELETE       | `/categories/:id`   | Admin  | Delete a category       |

### Category object

```json
{
  "_id": "665f...",
  "name": "Skin Care",
  "slug": "skin-care",
  "image": "https://...",
  "description": "...",
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Imported categories store a localized name (`"name": { "en": "Home & Kitchen Tools", "de": "...", "ar": "..." }`)
and also carry the imported fields `id`, `parent_id` (numeric id of the parent, `null` for top-level),
`subtitle`, `sort_order` and `is_active`. Categories created through the API may use a plain string name.

### POST `/categories`

```json
{
  "name": { "en": "Skin Care", "de": "Hautpflege" },
  "slug": "skin-care",
  "parent_id": 81,
  "sort_order": 10,
  "image": "uploads/3f9c….jpg",
  "description": "...",
  "isActive": true
}
```

`name.en` is required and must be unique (case-insensitive). `slug` is generated from the English
name when omitted. `parent_id` is the numeric `id` of a **top-level** category (only two levels),
or `null`. A new numeric `id` is assigned automatically. **201** — the created category.

### PUT / PATCH `/categories/:id`

Body: any of `name`, `slug`, `parent_id`, `sort_order`, `image`, `description`, `isActive`.
Translations are merged with the stored ones (an empty translation removes that language).
`isActive` updates both `isActive` and `is_active`. Changing the `slug` moves the products of the
category to the new slug. A category with sub-categories can't get a parent. **200** — the updated category.

### DELETE `/categories/:id`

**200** — `{ "message": "Category deleted", "id": "665f..." }`
**409** — the category still has sub-categories or products (move them, or hide the category instead).

---

## Orders — `/api/orders`

All order routes require login. Orders are looked up by MongoDB `_id`.

| Method | Path                    | Access          | Description                    |
| ------ | ----------------------- | --------------- | ------------------------------ |
| POST   | `/orders`               | User            | Place an order                 |
| GET    | `/orders/my-orders`     | User            | List my orders (newest first)  |
| GET    | `/orders/:id`           | Owner or Admin  | Get one order                  |
| PATCH  | `/orders/:id/cancel`    | Owner or Admin  | Cancel an order                |
| GET    | `/orders`               | Admin           | List all orders                |
| PATCH  | `/orders/:id/status`    | Admin           | Change order status            |
| PATCH  | `/orders/:id/payment`   | Admin           | Change payment status          |

### POST `/orders`

```json
{
  "items": [
    { "product": 12, "quantity": 2 },
    { "product": "665f1c2e9b1d4a0012345678", "quantity": 1 }
  ],
  "shippingAddress": {
    "fullName": "Ahmed Ali",
    "phone": "0100000000",
    "country": "Egypt",
    "city": "Cairo",
    "address": "12 Example St",
    "postalCode": "11511"
  },
  "paymentMethod": "cash",
  "notes": "Call before delivery",
  "couponCode": "WELCOME10"
}
```

- `items` is required and must not be empty (at most 100 items).
- `product` can be the product's numeric `id` or its MongoDB `_id`.
- `quantity` must be a whole number from 1 to 1000.
- `paymentMethod`: `cash` (default) or `card`.
- `couponCode` is optional; an unknown, inactive, expired, not-yet-valid or used-up code, or a subtotal below
  the coupon's minimum, gives **400** with the reason. A valid coupon's use is counted atomically.
- Prices and the discount are calculated on the server, never taken from the request.

**201** — the created order.

### Order object

```json
{
  "_id": "6660...",
  "orderNumber": "ORD-20261124-K3J9QX",
  "user": "665f...",
  "items": [
    {
      "product": "665f...",
      "name": { "en": "Face Cream", "de": "...", "ar": "..." },
      "sku": "FC-050",
      "image": "https://...",
      "price": 4.99,
      "quantity": 2,
      "subtotal": 9.98
    }
  ],
  "shippingAddress": { "fullName": "...", "phone": "...", "country": "...", "city": "...", "address": "...", "postalCode": "..." },
  "subtotal": 9.98,
  "shippingFee": 0,
  "discount": 1.00,
  "coupon": { "code": "WELCOME10", "type": "percent", "value": 10 },
  "totalPrice": 8.98,
  "paymentMethod": "cash",
  "paymentStatus": "pending",
  "status": "pending",
  "notes": "Call before delivery",
  "cancelledAt": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET `/orders`  (Admin)

Optional query:

| Param | Description |
| ----- | ----------- |
| `status` | `pending`, `confirmed`, `processing`, `shipped`, `delivered` or `cancelled` (**400** otherwise) |
| `paymentStatus` | `pending`, `paid`, `failed` or `refunded` |
| `search` | order number, customer username/email, delivery name or phone |
| `from`, `to` | date range on `createdAt`; ISO timestamps, or `YYYY-MM-DD` (`to` then includes that whole day) |
| `page`, `limit` | opt-in pagination (total in `X-Total-Count`); without them the full list is returned as before |

Each order's `user` is populated with `{ _id, username, email }`. Newest first.

### PATCH `/orders/:id/cancel`

No body. Only works while status is `pending` or `confirmed`; otherwise **400**.
**200** — the updated order (`status: "cancelled"`, `cancelledAt` set).

### PATCH `/orders/:id/status`  (Admin)

```json
{ "status": "shipped" }
```

Allowed values: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`.
**200** — the updated order.

### PATCH `/orders/:id/payment`  (Admin)

```json
{ "paymentStatus": "paid" }
```

Allowed values: `pending`, `paid`, `failed`, `refunded`.
**200** — the updated order.

---

## Coupons — `/api/coupons`

Coupons are looked up by MongoDB `_id`.

| Method       | Path                 | Access | Description                                  |
| ------------ | -------------------- | ------ | -------------------------------------------- |
| POST         | `/coupons/validate`  | User   | Check a code against a subtotal              |
| GET          | `/coupons`           | Admin  | List coupons (paginated)                     |
| POST         | `/coupons`           | Admin  | Create a coupon                              |
| GET          | `/coupons/:id`       | Admin  | Get one coupon                               |
| PUT / PATCH  | `/coupons/:id`       | Admin  | Update a coupon (partial)                    |
| DELETE       | `/coupons/:id`       | Admin  | Delete a coupon                              |

### Coupon object

```json
{
  "_id": "6661...",
  "code": "WELCOME10",
  "description": "10% off for newsletter sign-ups",
  "type": "percent",
  "value": 10,
  "minOrderAmount": 20,
  "maxDiscount": 5,
  "startsAt": null,
  "expiresAt": "2026-12-31T22:59:59.999Z",
  "usageLimit": 100,
  "usedCount": 3,
  "isActive": true,
  "status": "active",
  "createdAt": "...",
  "updatedAt": "..."
}
```

- `type`: `percent` (`value` 0.01–100) or `fixed` (`value` is an amount).
- `maxDiscount` caps a percent discount (`null` = no cap; always `null` for fixed coupons).
- `usageLimit`: total number of orders that may use it (`null` = unlimited). `usedCount` is maintained by the server.
- `status` is computed: `active`, `inactive` (switched off), `scheduled` (before `startsAt`), `expired` (after `expiresAt`) or `used-up`.
- `code` is stored upper-case: 3–32 characters, letters, numbers, `-` or `_`; unique (**409** otherwise).

### GET `/coupons`

Query: `search` (code or description), `status` (one of the values above), `page`, `limit`. Total in `X-Total-Count`.

### POST `/coupons/validate`

```json
{ "code": "welcome10", "subtotal": 45.5 }
```

**200** — `{ "code": "WELCOME10", "type": "percent", "value": 10, "description": "...", "discount": 4.55 }`
**404** — unknown code · **400** — not usable (inactive, expired, not valid yet, used up, or subtotal below the minimum).
This only checks the code; the discount is applied when the order is placed with `couponCode`.

---

## Admin — `/api/admin`

Every route here needs an admin token (**401** without a valid token, **403** for non-admins).

| Method | Path                     | Description                                              |
| ------ | ------------------------ | -------------------------------------------------------- |
| GET    | `/admin/stats`           | Dashboard figures                                        |
| GET    | `/admin/products`        | Product list including hidden products (paginated)      |
| GET    | `/admin/products/:id`    | One product (also hidden ones) by numeric id             |
| GET    | `/admin/categories`      | Every category (also hidden ones) with `productCount`    |
| GET    | `/admin/customers`       | Accounts with order totals (paginated)                   |
| GET    | `/admin/customers/:id`   | One account with its 10 latest orders                    |
| PATCH  | `/admin/customers/:id`   | Change `role` and/or `isBlocked`                         |
| POST   | `/admin/uploads`         | Upload an image                                          |

### GET `/admin/stats?days=30&tz=Europe/Berlin`

`days`: `7`, `30` (default) or `90`. `tz`: IANA time zone used for day boundaries (default `UTC`).
Revenue counts orders that are **not cancelled**; nothing is estimated.

```json
{
  "range": { "days": 30, "timeZone": "Europe/Berlin", "from": "2026-10-26", "to": "2026-11-24" },
  "totals": {
    "revenue": 1250.4, "paidRevenue": 980, "orders": 42, "pendingOrders": 3,
    "products": 355, "activeProducts": 350, "hiddenProducts": 5, "lowStockProducts": 2,
    "customers": 120
  },
  "period": { "revenue": 410.2, "orders": 12, "ordersPlaced": 13, "averageOrderValue": 34.18, "newCustomers": 9 },
  "ordersByStatus": { "pending": 3, "confirmed": 1, "processing": 0, "shipped": 4, "delivered": 33, "cancelled": 1 },
  "sales": [{ "date": "2026-10-26", "revenue": 0, "orders": 0 }, "... one entry per day ..."],
  "bestSellers": [{ "productId": 12, "name": { "en": "..." }, "image": "...", "isActive": true, "units": 9, "orders": 7, "revenue": 81.5 }],
  "recentOrders": [{ "_id": "...", "orderNumber": "ORD-...", "customer": { "username": "...", "email": "..." }, "totalPrice": 32, "status": "shipped", "paymentStatus": "paid", "createdAt": "...", "itemsCount": 2 }]
}
```

`period.orders` counts the period's orders that are not cancelled (the ones behind `period.revenue`);
`period.ordersPlaced` counts every order placed in the period. `bestSellers[].productId` is `null` when the product was deleted.

### GET `/admin/products`

Query: `search` (name, brand, SKU, slug or numeric id), `category` (slug; `none` = without category),
`status` (`active` / `inactive`), `stock` (`in`, `low` = 1–5, `none` = 0), `flag` (`featured`, `flash`, `discounted`),
`sort` (`id-desc` default, `id-asc`, `updated`, `name-asc`, `newest`, `price-asc`, `price-desc`, `stock-asc`, `stock-desc`, …),
`page`, `limit`. Same product objects as the public API plus `category_slug` (from the `category` field or the imported tag).

### GET `/admin/customers`

Query: `search` (username, email, phone), `role` (`user` / `admin`), `status` (`active` / `blocked`),
`sort` (`newest`, `oldest`, `name-asc`), `page`, `limit`.

```json
[{ "_id": "...", "username": "ahmed", "email": "...", "phone": null, "role": "user", "isBlocked": false,
   "addresses": [], "createdAt": "...", "ordersCount": 2, "totalSpent": 32, "lastOrderAt": "..." }]
```

`totalSpent` leaves out cancelled orders. Passwords are never returned.

### PATCH `/admin/customers/:id`

```json
{ "role": "admin", "isBlocked": false }
```

An admin can't change their own role or block themselves (**400**). A blocked account is refused at
login and on every request (**403**) until it is unblocked.

### POST `/admin/uploads`

Send the image itself as the request body with its type, e.g. `Content-Type: image/jpeg` (no multipart form).
Only JPEG, PNG, WebP and GIF are accepted, checked against the file's actual content; max 5 MB.

**201** — `{ "path": "uploads/3f9c…e1.jpg", "url": "http://localhost:3000/uploads/3f9c…e1.jpg", "size": 48213, "type": "image/jpeg" }`

Store `path` in a product's or category's `image`. Files are served at `/uploads/<file>` from the
backend's `uploads/` folder (back that folder up with the database).

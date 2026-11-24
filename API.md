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

> Registration always creates a `user`. To make an admin, set `role: "admin"` on the user directly in MongoDB.

## Errors

Every error returns a JSON body with a `message`:

```json
{ "message": "Product not found" }
```

| Status | When                                                   |
| ------ | ------------------------------------------------------ |
| 400    | Missing/invalid fields, invalid id                     |
| 401    | No token, bad/expired token, wrong credentials         |
| 403    | Not an admin, or not the owner of the order            |
| 404    | Resource or route not found                            |
| 409    | Duplicate value (e.g. username, email, slug already used) |
| 500    | Server error                                           |

---

## Auth — `/api/auth`

| Method | Path                  | Access | Description                    |
| ------ | --------------------- | ------ | ------------------------------ |
| POST   | `/auth/register`      | Public | Create an account              |
| POST   | `/auth/login`         | Public | Log in                         |
| POST   | `/auth/logout`        | User   | Log out                        |
| GET    | `/auth/me`            | User   | Get the current user           |
| POST   | `/auth/resetPassword` | User   | Change the current user's password |

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

### POST `/auth/logout`

No body. **200** — `{ "message": "Logged out" }`

> This marks the user inactive but does not revoke the token. The client should delete its stored token.

### GET `/auth/me`

**200** — `{ "user": { id, username, email, phone, role, addresses } }`

### POST `/auth/resetPassword`

Changes the password of the logged-in user (this is not a "forgot password" flow).

```json
{ "currentPassword": "secret123", "newPassword": "newSecret456" }
```

**200** — `{ "message": "Password updated" }`
**401** — `Current password is incorrect`.

---

## Products — `/api/products`

Products are looked up by their **numeric `id`** (e.g. `/products/12`), not the MongoDB `_id`.

| Method       | Path              | Access | Description                     |
| ------------ | ----------------- | ------ | ------------------------------- |
| GET          | `/products`       | Public | List active products            |
| GET          | `/products/flash` | Public | List active flash-sale products |
| GET          | `/products/:id`   | Public | Get one product                 |
| POST         | `/products`       | Admin  | Create a product                |
| PUT / PATCH  | `/products/:id`   | Admin  | Update a product                |
| DELETE       | `/products/:id`   | Admin  | Delete a product                |

### GET `/products`

Optional query params:

| Param      | Example          | Description                                    |
| ---------- | ---------------- | ---------------------------------------------- |
| `brand`    | `?brand=Nivea`   | Exact brand match                              |
| `featured` | `?featured=true` | `true` or `false`                              |
| `search`   | `?search=cream`  | Case-insensitive match on name (en/de/ar) or brand |

**200** — array of products, sorted by `id`.

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
  "tags": {},
  "featured": false,
  "flash_sale": true,
  "reward_points": 5,
  "is_active": true,
  "created_at": "2026-11-23T20:00:00.000Z",
  "updated_at": "2026-11-23T20:00:00.000Z"
}
```

Note: `price`, `old_price` and `rating` are **strings**.

### POST `/products`

Body: any fields from the product object above. `slug` and `price` are required. `id` is optional — if omitted, the next free number is used.

**201** — the created product.

### PUT / PATCH `/products/:id`

Body: only the fields you want to change (`id` cannot be changed). Both methods behave the same (partial update).

**200** — the updated product.
**400** — `No valid fields to update` if the body has no known fields.

### DELETE `/products/:id`

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

### POST `/categories`

```json
{ "name": "Skin Care", "slug": "skin-care", "image": "https://...", "description": "..." }
```

`name` and `slug` are required and must be unique. **201** — the created category.

### PUT / PATCH `/categories/:id`

Body: any of `name`, `slug`, `image`, `description`, `isActive`. **200** — the updated category.

### DELETE `/categories/:id`

**200** — `{ "message": "Category deleted" }`

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
  "notes": "Call before delivery"
}
```

- `items` is required and must not be empty.
- `product` can be the product's numeric `id` or its MongoDB `_id`.
- `quantity` must be a positive integer.
- `paymentMethod`: `cash` (default) or `card`.
- Prices are taken from the database, not from the request.

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
  "discount": 0,
  "totalPrice": 9.98,
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

Optional query: `?status=pending` to filter by status. Each order's `user` is populated with `{ _id, username, email }`.

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

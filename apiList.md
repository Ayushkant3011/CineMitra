# CineMitra APIs

# CineMitra — API Design

## Auth strategy

JWT tokens, cookie-based (not `Authorization` headers).

- **Access token** — short-lived (15 min), httpOnly cookie, checked by an `auth` middleware on protected routes.
- **Refresh token** — longer-lived (7 days), httpOnly cookie, used only to mint new access tokens via `/api/auth/refresh`.
- Both cookies set with `SameSite=None; Secure`, since frontend (Vercel) and backend (Render) are different origins.
- Backend CORS: `credentials: true`, origin set to the exact frontend URL (not `*`).
- Frontend requests: `credentials: 'include'` on every call so cookies are sent cross-origin.

## Response conventions

- Success: `{ data: ... }`
- Error: `{ error: { message, code } }`
- Standard HTTP status codes (`400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict — e.g. seat already held, `500` server error)

## Auth

| Method | Path | Auth | Request body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/signup` | none | `{ name, email, password }` | user object; sets cookies | |
| POST | `/api/login` | none | `{ email, password }` | user object; sets cookies | |
| POST | `/api/refresh` | refresh cookie | — | sets new access token cookie | |
| POST | `/api/logout` | required | — | `204` | clears both cookies |
| GET | `/api/profile` | required | — | current user profile | |

## Movies

| Method | Path | Auth | Query / body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/movies` | none | `city`, `language`, `genre`, `search` | movie list | |
| GET | `/api/movies/:id` | none | — | movie details | |

## Shows

| Method | Path | Auth | Query / body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/api/movies/:id/shows` | none | `city`, `date` | shows grouped by theatre | |
| GET | `/api/shows/:id` | none | — | theatre, screen, time, price | |
| GET | `/api/shows/:id/seats` | none | — | seat map: available / held / booked | |

## Bookings

| Method | Path | Auth | Request body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/bookings/hold` | required | `{ showId, seatIds[] }` | booking (status `pending_payment`) + `held_until` | holds seats, all-or-nothing |
| GET | `/api/bookings` | required | — | booking history for the user | |
| GET | `/api/bookings/:id` | required | — | one booking's details | |
| POST | `/api/bookings/:id/cancel` | required | — | updated booking | allowed only within the cancellation cutoff; triggers refund |

No `confirm` endpoint — a booking is confirmed only as a side effect of verified payment, never by a direct client call.

## Payments

| Method | Path | Auth | Request body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/api/payments/order` | required | `{ bookingId }` | Razorpay order details | booking must be `pending_payment` and not expired |
| POST | `/api/payments/verify` | required | `{ orderId, paymentId, signature }` | confirmed booking | server verifies signature before confirming |
| POST | `/api/payments/webhook` | none (Razorpay signature) | Razorpay event payload | `200` | source of truth; must be idempotent via `webhook_events` |

## Admin (thin API)

| Method | Path | Auth | Request body | Notes |
|---|---|---|---|---|
| POST | `/api/admin/movies` | admin | movie fields | |
| PUT | `/api/admin/movies/:id` | admin | movie fields | |
| POST | `/api/admin/theatres` | admin | theatre fields | |
| POST | `/api/admin/screens` | admin | screen fields | |
| POST | `/api/admin/seats` | admin | seat layout array | bulk-create a screen's seats |
| POST | `/api/admin/shows` | admin | show fields + seat category prices | creates show + `show_seat_prices` |
| PUT | `/api/admin/shows/:id` | admin | show fields / `status` | edit or cancel a show |
| GET | `/api/admin/shows/:id/bookings` | admin | — | bookings and payment status for a show |


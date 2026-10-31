# CineMitra API Reference and Test Log

Everything built and tested so far. Base URL: `http://localhost:5000`

## Conventions

- Success: `{ "data": { ... } }`
- Error: `{ "error": { "message": "...", "code": "..." } }`
- Ids are `bigint` in Postgres, so they come back as **strings** (`"id": "4"`).
- Ids in the examples (`movieId: 1`, `screenId: 1`) depend on your database. Use the ids you actually have.

## Testing notes

- Postman keeps **one cookie jar per domain** shared by all tabs. Logging in as someone else changes who every tab runs as. Always log in as the account you want to test, with no other login in between.
- Test accounts: a normal `user` account and an `admin` account.
- Promote an account to admin:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'youremail';
  ```
  The role is read from the database on every request, so it takes effect immediately (no re-login needed).


## Endpoint summary

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/health` | none | done |
| POST | `/api/signup` | none | done |
| POST | `/api/login` | none | done |
| POST | `/api/logout` | required | done |
| POST | `/api/refresh` | refresh cookie | done |
| GET | `/api/profile` | required | done |
| POST | `/api/admin/movies` | admin | done |
| PUT | `/api/admin/movies/:id` | admin | done |
| POST | `/api/admin/theatres` | admin | done |
| POST | `/api/admin/screens` | admin | done |
| POST | `/api/admin/seats` | admin | done |
| POST | `/api/admin/shows` | admin | done |

---

## 1. Health

`GET /health` returns `200`:
```json
{ "status": "ok", "service": "cinemitra-api" }
```

Unknown route, for example `GET /api/nothing`, returns `404`:
```json
{ "error": { "message": "Route not found", "code": "NOT_FOUND" } }
```

---

## 2. Auth

### POST /api/signup

Creates a user with role `user` and sets both cookies. A `role` field in the body is ignored.

Validation: `firstName` and `lastName` 1 to 50 chars (trimmed); `email` valid, lowercased; `password` 8 to 72 chars with at least one letter and one number.

**Valid request**
```json
{
  "firstName": "Ayush",
  "lastName": "Test",
  "email": "ayush@example.com",
  "password": "password123"
}
```

**Success: `201`**
```json
{
  "data": {
    "user": {
      "id": "4",
      "firstName": "Ayush",
      "lastName": "Test",
      "email": "ayush@example.com",
      "role": "user"
    }
  }
}
```
Plus two `Set-Cookie` headers (`access_token`, `refresh_token`), both starting with `eyJ`.

| Scenario | Payload change | Expected |
|---|---|---|
| Role is ignored (security test) | add `"role": "admin"` | `201`, response shows `role: "user"` |
| Email lowercased | `"email": "Ayush@Example.com"` | `201`, stored as `ayush@example.com` |
| Duplicate email | send the valid body twice | `409`, `EMAIL_TAKEN` |
| Duplicate email, different case | `"email": "AYUSH@example.com"` after signup | `409`, `EMAIL_TAKEN` |
| Weak password | `"password": "abc"` | `400`, `VALIDATION_ERROR` |
| Password without a number | `"password": "onlyletters"` | `400`, `VALIDATION_ERROR` |
| Password without a letter | `"password": "12345678"` | `400`, `VALIDATION_ERROR` |
| Invalid email | `"email": "notanemail"` | `400`, `VALIDATION_ERROR` |
| Missing first name | remove `firstName` | `400`, `VALIDATION_ERROR` |
| Broken JSON | body `{ "email": ` | `400`, `BAD_JSON` |

DB check:
```sql
SELECT id, first_name, email, role, left(password_hash, 7) FROM users;
```
The hash must start with `$2a$10$` (bcrypt), never the plain password.

### POST /api/login

**Request**
```json
{ "email": "ayush@example.com", "password": "password123" }
```

**Success: `200`**: same `{ data: { user } }` shape as signup, plus both cookies.

| Scenario | Payload | Expected |
|---|---|---|
| Correct credentials | as above | `200`, cookies set |
| Wrong password | `"password": "wrongpass1"` | `401`, `INVALID_CREDENTIALS` |
| Unknown email | `"email": "nobody@example.com"` | `401`, `INVALID_CREDENTIALS` (identical message to wrong password) |
| Email in different case | `"email": "AYUSH@EXAMPLE.COM"` | `200` (email column is `citext`) |
| Missing password | `{ "email": "ayush@example.com" }` | `400`, `VALIDATION_ERROR` |
| Role is read fresh after promotion | promote the account in SQL, log in, decode `access_token` at jwt.io | token payload shows `"role": "admin"` |

### GET /api/profile

Requires login. Returns the current user, with no password hash.

**Success: `200`**
```json
{
  "data": {
    "user": { "id": "6", "firstName": "Ayush", "lastName": "Test", "email": "ayush1@example.com", "role": "user" }
  }
}
```

| Scenario | How | Expected |
|---|---|---|
| Logged in | login, then GET | `200` with your user |
| Not logged in | clear cookies, then GET | `401`, `UNAUTHENTICATED` |
| Tampered token | change one character of the `access_token` cookie value | `401`, `INVALID_TOKEN` |
| Expired token | temporarily set `expiresIn: "5s"` in `signAccessToken`, log in, wait 6 s | `401`, `TOKEN_EXPIRED` (change it back to `"15m"`) |
| Role change applies immediately | promote in SQL, GET profile without logging in again | shows the new role |

### POST /api/logout and POST /api/refresh

These two were built and tested earlier. The scenarios below follow the API design doc, so confirm the status codes against your implementation.

| Endpoint | Scenario | Expected |
|---|---|---|
| `POST /api/logout` | logged in | `204`, both cookies cleared |
| `POST /api/logout` | then `GET /api/profile` | `401`, `UNAUTHENTICATED` |
| `POST /api/refresh` | valid `refresh_token` cookie | new `access_token` cookie set |
| `POST /api/refresh` | no or invalid `refresh_token` cookie | `401` |

---

## 3. Admin: access control

Every `/api/admin/*` route runs `userAuth` then `requireRole("admin")` before anything else. This guard must stay **above** all admin routes in `routes/admin.js`.

| Scenario | Expected |
|---|---|
| Not logged in | `401`, `UNAUTHENTICATED` |
| Logged in as `user` | `403`, `FORBIDDEN` |
| Logged in as `admin` | request passes through |

Run these three checks for every admin endpoint.

---

## 4. Admin: movies

### POST /api/admin/movies

**Request**
```json
{
  "title": "Inception",
  "description": "A thief who steals secrets through dreams.",
  "language": "English",
  "genre": "Sci-Fi",
  "durationMinutes": 148,
  "posterUrl": "https://example.com/inception.jpg",
  "releaseDate": "2010-07-16"
}
```
Required: `title`, `language`, `durationMinutes`. Optional: `description`, `genre`, `posterUrl`, `releaseDate` (format `YYYY-MM-DD`).

**Success: `201`**
```json
{
  "data": {
    "movie": {
      "id": "1",
      "title": "Inception",
      "description": "A thief who steals secrets through dreams.",
      "language": "English",
      "genre": "Sci-Fi",
      "durationMinutes": 148,
      "posterUrl": "https://example.com/inception.jpg",
      "releaseDate": "2010-07-16"
    }
  }
}
```

| Scenario | Payload change | Expected |
|---|---|---|
| Valid, as admin | body above | `201`, `releaseDate` returned as `"2010-07-16"` |
| Normal user | same body | `403` |
| Not logged in | same body | `401` |
| Missing title | remove `title` | `400`, `VALIDATION_ERROR` |
| Duration as a string | `"durationMinutes": "148"` | `400` |
| Wrong date format | `"releaseDate": "16-07-2010"` | `400` |

### PUT /api/admin/movies/:id

Partial update. Send only the fields to change; at least one is required.

**Request** (`PUT /api/admin/movies/1`)
```json
{ "genre": "Thriller" }
```

**Success: `200`**: the full updated movie, with only `genre` changed.

| Scenario | Request | Expected |
|---|---|---|
| Change one field | `PUT /api/admin/movies/1`, `{ "genre": "Thriller" }` | `200`, only genre changed |
| Empty body | `PUT /api/admin/movies/1`, `{}` | `400`, "at least one field is required" |
| Movie does not exist | `PUT /api/admin/movies/99999` | `404`, `MOVIE_NOT_FOUND` |
| Non-numeric id | `PUT /api/admin/movies/abc` | `400`, `VALIDATION_ERROR` |

---

## 5. Admin: theatres

### POST /api/admin/theatres

**Request**
```json
{
  "name": "PVR Select City",
  "city": "Delhi",
  "address": "Saket, New Delhi"
}
```

**Success: `201`**
```json
{ "data": { "theatre": { "id": "1", "name": "PVR Select City", "city": "Delhi", "address": "Saket, New Delhi" } } }
```

| Scenario | Payload change | Expected |
|---|---|---|
| Valid, as admin | body above | `201` |
| Missing city | remove `city` | `400`, `VALIDATION_ERROR` |
| Normal user | same body | `403` |

---

## 6. Admin: screens

Requires migration `screens-unique-name`, which adds a unique constraint on `(theatre_id, name)`.

### POST /api/admin/screens

**Request**
```json
{ "theatreId": 1, "name": "Screen 1" }
```

**Success: `201`**
```json
{ "data": { "screen": { "id": "1", "theatreId": "1", "name": "Screen 1" } } }
```

| Scenario | Payload change | Expected |
|---|---|---|
| Valid | body above | `201` |
| Same name, same theatre again | send the same body twice | `409`, `SCREEN_NAME_TAKEN` |
| Theatre does not exist | `"theatreId": 99999` | `404`, `THEATRE_NOT_FOUND` |
| Id as a string | `"theatreId": "1"` | `400`, `VALIDATION_ERROR` |

---

## 7. Admin: seats (bulk layout)

The body describes rows, and the server expands each row into seats numbered `1..seatCount`. All seats go in with one `INSERT`, so it is **all or nothing**.

### POST /api/admin/seats

**Request**
```json
{
  "screenId": 1,
  "rows": [
    { "rowLabel": "A", "seatCount": 10, "category": "silver" },
    { "rowLabel": "B", "seatCount": 10, "category": "silver" },
    { "rowLabel": "C", "seatCount": 8, "category": "gold" },
    { "rowLabel": "D", "seatCount": 6, "category": "premium" }
  ]
}
```
Limits: 1 to 30 rows, `seatCount` 1 to 50, `rowLabel` 1 to 2 letters (stored uppercase), `category` one of `silver`, `gold`, `premium`.

**Success: `201`**
```json
{ "data": { "screenId": 1, "created": 34 } }
```

| Scenario | Payload change | Expected |
|---|---|---|
| Valid layout | body above | `201`, `created: 34` |
| Same layout again | send the same body twice | `409`, `SEATS_EXIST`; seat count in the DB stays at 34 |
| Screen does not exist | `"screenId": 99999` | `404`, `SCREEN_NOT_FOUND` |
| Duplicate row label | two rows both with `"rowLabel": "A"` | `400`, "duplicate rowLabel" |
| Invalid category | `"category": "vip"` | `400` |
| Zero seats | `"seatCount": 0` | `400` |
| Count as a string | `"seatCount": "10"` | `400` |
| Lowercase label | `"rowLabel": "a"` | accepted, stored as `A` |

DB check:
```sql
SELECT row_label, category, count(*)
FROM seats WHERE screen_id = 1
GROUP BY 1, 2 ORDER BY 1;
```
Expected: A and B with 10 silver each, C with 8 gold, D with 6 premium.

---

## 8. Admin: shows

Creates a show and its per-category prices in **one transaction**. Rules enforced:

1. The movie and the screen must exist.
2. The screen must have seats.
3. `prices` must include **every seat category present on the screen**.
4. No two non-cancelled shows on the same screen may overlap in time. This is enforced by the database through the exclusion constraint `no_overlapping_shows_per_screen`. Back-to-back shows are allowed.

Requires migration `shows-no-overlap`, which enables the `btree_gist` extension.

### POST /api/admin/shows

**Request**
```json
{
  "movieId": 1,
  "screenId": 1,
  "startTime": "2026-11-01T18:00:00+05:30",
  "endTime": "2026-11-01T20:30:00+05:30",
  "prices": [
    { "category": "silver", "price": 150 },
    { "category": "gold", "price": 220 },
    { "category": "premium", "price": 350 }
  ]
}
```
Times must be ISO 8601 **with an offset**. Prices are positive, with at most 2 decimals, and one entry per category.

**Success: `201`**
```json
{
  "data": {
    "show": {
      "id": "1",
      "movieId": "1",
      "screenId": "1",
      "startTime": "2026-11-01T12:30:00.000Z",
      "endTime": "2026-11-01T15:00:00.000Z",
      "status": "scheduled",
      "prices": [
        { "category": "silver", "price": 150 },
        { "category": "gold", "price": 220 },
        { "category": "premium", "price": 350 }
      ]
    }
  }
}
```
Times come back in UTC. `18:00+05:30` is `12:30Z`.

| Scenario | Payload change | Expected |
|---|---|---|
| Valid show | body above | `201` |
| Overlapping show, same screen | `startTime` `19:00+05:30`, `endTime` `21:30+05:30` | `409`, `SHOW_OVERLAP` |
| Back-to-back show | `startTime` `20:30+05:30`, `endTime` `23:00+05:30` | `201` (allowed) |
| Missing a category price | remove the `premium` price | `400`, `MISSING_PRICES` |
| Screen has no seats | use a new screen with no seats | `409`, `SCREEN_HAS_NO_SEATS` |
| Movie does not exist | `"movieId": 99999` | `404`, `MOVIE_NOT_FOUND` |
| Screen does not exist | `"screenId": 99999` | `404`, `SCREEN_NOT_FOUND` |
| End before start | swap the two times | `400`, `VALIDATION_ERROR` |
| Time without an offset | `"startTime": "2026-11-01 18:00"` | `400`, `VALIDATION_ERROR` |
| Duplicate category | two `silver` entries in `prices` | `400`, `VALIDATION_ERROR` |
| Normal user / not logged in | any valid body | `403` / `401` |

DB checks:
```sql
SELECT s.id, s.screen_id, s.start_time, s.end_time, p.category, p.price
FROM shows s JOIN show_seat_prices p ON p.show_id = s.id
ORDER BY s.id, p.category;
```
Each show must have exactly 3 price rows. Failed requests must leave no extra rows in either table:
```sql
SELECT (SELECT count(*) FROM shows) * 3 AS expected_price_rows,
       (SELECT count(*) FROM show_seat_prices) AS actual_price_rows;
```
Both numbers must match.

Note: ids skip numbers after failed inserts (for example show ids 1 and 4). Postgres sequences never reuse numbers, and this is normal.

---

## Error codes seen so far

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body failed schema validation |
| `BAD_JSON` | 400 | Request body is not valid JSON |
| `MISSING_PRICES` | 400 | A seat category on the screen has no price |
| `UNAUTHENTICATED` | 401 | No cookie, or user no longer exists |
| `INVALID_TOKEN` | 401 | Token is malformed or tampered with |
| `TOKEN_EXPIRED` | 401 | Access token expired (frontend should call `/api/refresh`) |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (same message for both) |
| `FORBIDDEN` | 403 | Logged in, but the role is not allowed |
| `NOT_FOUND` | 404 | Unknown route |
| `MOVIE_NOT_FOUND` | 404 | No movie with that id |
| `THEATRE_NOT_FOUND` | 404 | No theatre with that id |
| `SCREEN_NOT_FOUND` | 404 | No screen with that id |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `SCREEN_NAME_TAKEN` | 409 | Theatre already has a screen with that name |
| `SEATS_EXIST` | 409 | One or more of those seats already exist on the screen |
| `SCREEN_HAS_NO_SEATS` | 409 | Cannot create a show on a screen without seats |
| `SHOW_OVERLAP` | 409 | Another show on that screen overlaps the time |
| `INTERNAL` | 500 | Unexpected server error (details are logged server-side only) |

---

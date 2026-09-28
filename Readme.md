# CineMitra

A movie ticket booking platform (in the spirit of BookMyShow) built to solve one hard backend problem well: **never sell the same seat twice, even when many users, payments, and expiries overlap.**

## About the project

CineMitra lets customers browse movies, pick seats on a live seat map, pay online, and receive a ticket. Admins manage movies, theatres, and shows through a thin API.

The UI, movie listings, and auth are supporting pieces. The real project is the booking engine underneath:

- **Concurrency control:** many requests hit the same seat at once, and exactly one wins.
- **State with expiry:** a seat is not just available or booked. It can be temporarily held, and holds must expire correctly.
- **Consistency across systems:** the database and the payment provider can disagree, and the system must converge to a correct state.
- **Reliability under failure:** closed browsers, duplicate or late webhooks, crashes, and timeouts must all end in a correct state.

The project's headline claim: *a ticket booking system that guarantees no double booking under concurrent load, handles payment failures and lock expiry safely, and is load-tested to prove it.*

## Users

- **Customer:** browses movies, books seats, pays, receives tickets, cancels bookings.
- **Admin:** manages movies, theatres, screens, and shows (via thin admin API in v1).

## Functional requirements

### Customer

1. Sign up, log in, and manage a basic profile.
2. Browse movies currently showing, with search and filters (city, language, genre).
3. See shows for a movie by theatre and time.
4. View a live seat map for a show, showing available, held, and booked seats.
5. Select one or more seats (with a maximum per booking) and hold them temporarily.
6. Pay for the held seats online.
7. Receive a booking confirmation with a booking ID and a ticket (QR code).
8. View booking history.
9. Cancel a booking under defined cancellation rules (in v1).
10. Receive an automatic refund when a valid cancellation is made, or when payment succeeds but the booking cannot be honored (in v1).

### Admin (thin API plus seed data in v1)

1. Add and edit movies, theatres, screens, and seat layouts.
2. Create and cancel shows, with pricing per seat category.
3. View bookings and payment status for a show.

## Core business rules

Each rule must be testable.

- A seat can never be confirmed for two people for the same show.
- A seat hold lasts a fixed duration (target: 10 minutes) and then releases automatically.
- Multi-seat bookings are all-or-nothing.
- A booking is confirmed only after payment is verified server-side, never because the client claims it paid.
- Duplicate or late payment webhooks must not create duplicate bookings or double charges.
- If payment arrives after the hold expired and the seat is no longer available, the user is refunded automatically.
- Users cannot book shows that have already started or been cancelled.
- Cancellation is allowed only within a defined window before showtime (exact cutoff and refund amount to be decided).
- A cancelled booking releases its seats back to availability, and a refund is issued exactly once, even if the cancel request is retried.
- If an admin cancels a show, all its bookings are cancelled and fully refunded.

## Non-functional requirements

- **Correctness first:** zero double bookings under concurrent load. This is the headline requirement.
- **Consistency:** booking, payment, and hold states must converge to a correct state after crashes, retries, and timeouts.
- **Performance:** the seat map loads fast, and seat selection stays responsive when many users hit the same show. Concrete targets to be set later.
- **Security:** hashed passwords, authenticated sessions, role-based admin access, verified payment signatures, rate limiting on booking endpoints.
- **Observability:** logs and an audit trail for every booking and payment state change, so "what happened to this seat?" is always answerable.
- **Deployability:** runs from a clean setup with one command locally, and is deployed with a live link.
- **Verifiability:** a load test proving the no-double-booking guarantee (for example, 500 simultaneous requests for one seat with exactly one success).
- **Documentation:** the README covers the architecture, the concurrency problem, and the solution.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React (separate app from the backend) |
| Backend | Node.js with Express (CommonJS), a single API server |
| Database | PostgreSQL, using `pg` (node-postgres) with plain SQL |
| Payments | Razorpay |

## Open decisions

- Cancellation cutoff window and refund amount rules
- Maximum seats per booking
- Hold duration (target 10 minutes, to be confirmed)
- Concrete performance targets

## Status

Requirements phase. No design or implementation yet.
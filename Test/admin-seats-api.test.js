const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");

process.env.DATABASE_URL ||= "postgres://127.0.0.1:5432/cinemitra_test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-at-least-32-characters";
process.env.CLIENT_URL ||= "http://localhost:5173";

const app = require("../src/app");
const env = require("../src/config/env");
const Seat = require("../src/repositories/seat.repository");
const User = require("../src/repositories/user.repository");

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  const closed = new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server.closeAllConnections();
  await closed;
});

const accessCookie = (role) => {
  const token = jwt.sign({ role }, env.jwtAccessSecret, {
    subject: "42",
    expiresIn: "5m",
  });
  return `access_token=${token}`;
};

const postSeats = (body, cookie = accessCookie("admin")) => fetch(`${baseUrl}/api/admin/seats`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
  },
  body: JSON.stringify(body),
});

test("admin creates seats from the submitted row layout", async () => {
  let seatInput;
  User.findById = async () => ({ id: "42", role: "admin" });
  Seat.createSeats = async (screenId, seats) => {
    seatInput = { screenId, seats };
    return seats.length;
  };

  const response = await postSeats({
    screenId: 13,
    rows: [
      { rowLabel: "a", seatCount: 2, category: "silver" },
      { rowLabel: "B", seatCount: 1, category: "premium" },
    ],
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(seatInput, {
    screenId: 13,
    seats: [
      { rowLabel: "A", seatNumber: 1, category: "silver" },
      { rowLabel: "A", seatNumber: 2, category: "silver" },
      { rowLabel: "B", seatNumber: 1, category: "premium" },
    ],
  });
  assert.deepEqual(body.data, { screenId: 13, created: 3 });
});

test("seat creation rejects invalid layouts without calling the repository", async () => {
  let createCalled = false;
  User.findById = async () => ({ id: "42", role: "admin" });
  Seat.createSeats = async () => {
    createCalled = true;
    return 0;
  };

  const response = await postSeats({
    screenId: 13,
    rows: [
      { rowLabel: "A", seatCount: 2, category: "silver" },
      { rowLabel: "a", seatCount: 1, category: "gold" },
    ],
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(createCalled, false);
});

test("seat creation requires an authenticated admin", async (context) => {
  const layout = {
    screenId: 13,
    rows: [{ rowLabel: "A", seatCount: 1, category: "silver" }],
  };

  await context.test("unauthenticated", async () => {
    const response = await postSeats(layout, null);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "UNAUTHENTICATED");
  });

  await context.test("non-admin user", async () => {
    User.findById = async () => ({ id: "42", role: "user" });
    const response = await postSeats(layout, accessCookie("user"));
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, "FORBIDDEN");
  });
});

test("seat creation reports a missing screen", async () => {
  User.findById = async () => ({ id: "42", role: "admin" });
  Seat.createSeats = async () => {
    throw Object.assign(new Error("foreign key violation"), { code: "23503" });
  };

  const response = await postSeats({
    screenId: 999,
    rows: [{ rowLabel: "A", seatCount: 1, category: "silver" }],
  });
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "SCREEN_NOT_FOUND");
});

test("seat creation reports seats that already exist", async () => {
  User.findById = async () => ({ id: "42", role: "admin" });
  Seat.createSeats = async () => {
    throw Object.assign(new Error("unique constraint violation"), { code: "23505" });
  };

  const response = await postSeats({
    screenId: 13,
    rows: [{ rowLabel: "A", seatCount: 1, category: "silver" }],
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error.code, "SEATS_EXIST");
});

const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");
const bcrypt = require("bcryptjs");

process.env.DATABASE_URL ||= "postgres://test:test@127.0.0.1:5432/cinemitra_test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-at-least-32-characters";
process.env.CLIENT_URL ||= "http://localhost:5173";

const app = require("../src/app");
const User = require("../src/repositories/user.repository");

let server;
let baseUrl;

const userRow = {
  id: "42",
  first_name: "Asha",
  last_name: "Patel",
  email: "asha@example.com",
  role: "user",
};

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

const postJson = (path, body) => fetch(`${baseUrl}${path}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

test("signup validates input, creates a user, and sets auth cookies", async () => {
  let createdUser;
  User.createUser = async (user) => {
    createdUser = user;
    return userRow;
  };

  const response = await postJson("/api/signup", {
    firstName: " Asha ",
    lastName: "Patel",
    email: "ASHA@example.com",
    password: "Cinema123",
  });
  const body = await response.json();
  const cookies = response.headers.getSetCookie();

  assert.equal(response.status, 201);
  assert.deepEqual(body.data.user, {
    id: "42",
    firstName: "Asha",
    lastName: "Patel",
    email: "asha@example.com",
    role: "user",
  });
  assert.equal(createdUser.email, "asha@example.com");
  assert.equal(Object.hasOwn(createdUser, "id"), false);
  assert.notEqual(createdUser.passwordHash, "Cinema123");
  assert.ok(cookies.some((cookie) => cookie.startsWith("access_token=")));
  assert.ok(cookies.some((cookie) => cookie.startsWith("refresh_token=")));
});

test("signup rejects invalid input", async () => {
  const response = await postJson("/api/signup", {
    firstName: "",
    lastName: "Patel",
    email: "not-an-email",
    password: "short",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("login accepts valid credentials and sets auth cookies", async () => {
  const passwordHash = await bcrypt.hash("Cinema123", 4);
  User.findByEmail = async () => ({ ...userRow, password_hash: passwordHash });

  const response = await postJson("/api/login", {
    email: "ASHA@example.com",
    password: "Cinema123",
  });
  const body = await response.json();
  const cookies = response.headers.getSetCookie();

  assert.equal(response.status, 200);
  assert.equal(body.data.user.email, "asha@example.com");
  assert.ok(cookies.some((cookie) => cookie.startsWith("access_token=")));
  assert.ok(cookies.some((cookie) => cookie.startsWith("refresh_token=")));
});

test("profile returns the authenticated user's public details", async () => {
  User.findById = async () => userRow;
  const loginResponse = await postJson("/api/login", {
    email: "asha@example.com",
    password: "Cinema123",
  });
  const cookie = loginResponse.headers.getSetCookie()
    .find((value) => value.startsWith("access_token="))
    .split(";", 1)[0];

  const response = await fetch(`${baseUrl}/api/profile`, {
    headers: { cookie },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.data.user, {
    id: "42",
    firstName: "Asha",
    lastName: "Patel",
    email: "asha@example.com",
    role: "user",
  });
});

test("profile rejects requests without an access token", async () => {
  const response = await fetch(`${baseUrl}/api/profile`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHENTICATED");
});

test("logout responds successfully", async () => {
  const response = await postJson("/api/logout", {});

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "Logout SuccessFull !!!");
});

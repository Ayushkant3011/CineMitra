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
const Screen = require("../src/repositories/screen.repository");
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

const postScreen = (body, cookie = accessCookie("admin")) => fetch(`${baseUrl}/api/admin/screens`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
  },
  body: JSON.stringify(body),
});

test("admin creates a screen and returns its public details", async () => {
  let screenInput;
  User.findById = async () => ({ id: "42", role: "admin" });
  Screen.createScreen = async (input) => {
    screenInput = input;
    return { id: "13", theatre_id: "5", name: "Screen 1" };
  };

  const response = await postScreen({ theatreId: 5, name: " Screen 1 " });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(screenInput, { theatreId: 5, name: "Screen 1" });
  assert.deepEqual(body.data.screen, {
    id: "13",
    theatreId: "5",
    name: "Screen 1",
  });
});

test("screen creation rejects invalid input without calling the repository", async () => {
  let createCalled = false;
  User.findById = async () => ({ id: "42", role: "admin" });
  Screen.createScreen = async () => {
    createCalled = true;
    return { id: "13", theatre_id: "5", name: "Screen 1" };
  };

  const response = await postScreen({ theatreId: -1, name: "" });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(createCalled, false);
});

test("screen creation requires an authenticated admin", async (context) => {
  await context.test("unauthenticated", async () => {
    const response = await postScreen({ theatreId: 5, name: "Screen 1" }, null);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, "UNAUTHENTICATED");
  });

  await context.test("non-admin user", async () => {
    User.findById = async () => ({ id: "42", role: "user" });
    const response = await postScreen({ theatreId: 5, name: "Screen 1" }, accessCookie("user"));
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, "FORBIDDEN");
  });
});

test("screen creation reports a missing theatre", async () => {
  User.findById = async () => ({ id: "42", role: "admin" });
  Screen.createScreen = async () => {
    throw Object.assign(new Error("foreign key violation"), { code: "23503" });
  };

  const response = await postScreen({ theatreId: 999, name: "Screen 1" });
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "THEATRE_NOT_FOUND");
});

test("screen creation reports a duplicate screen name", async () => {
  User.findById = async () => ({ id: "42", role: "admin" });
  Screen.createScreen = async () => {
    throw Object.assign(new Error("unique constraint violation"), { code: "23505" });
  };

  const response = await postScreen({ theatreId: 5, name: "Screen 1" });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error.code, "SCREEN_NAME_TAKEN");
});

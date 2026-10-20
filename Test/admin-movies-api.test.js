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
const Movie = require("../src/repositories/movie.repository");
const User = require("../src/repositories/user.repository");

let server;
let baseUrl;

const movieRow = {
  id: 7,
  title: "The Test Film",
  description: "A movie for API tests",
  language: "English",
  genre: "Drama",
  duration_minutes: 120,
  poster_url: "https://example.com/poster.jpg",
  release_date: "2026-01-15",
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

const accessCookie = (role) => {
  const token = jwt.sign({ role }, env.jwtAccessSecret, {
    subject: "42",
    expiresIn: "5m",
  });
  return `access_token=${token}`;
};

const sendJson = (path, method, body, cookie) => fetch(`${baseUrl}${path}`, {
  method,
  headers: {
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
  },
  body: JSON.stringify(body),
});

test("admin creates a movie and returns the public movie shape", async () => {
  let createdMovie;
  User.findById = async () => ({ id: "42", role: "admin" });
  Movie.createMovie = async (movie) => {
    createdMovie = movie;
    return movieRow;
  };

  const response = await sendJson("/api/admin/movies", "POST", {
    title: " The Test Film ",
    description: "A movie for API tests",
    language: "English",
    genre: "Drama",
    durationMinutes: 120,
    posterUrl: "https://example.com/poster.jpg",
    releaseDate: "2026-01-15",
  }, accessCookie("admin"));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(createdMovie, {
    title: "The Test Film",
    description: "A movie for API tests",
    language: "English",
    genre: "Drama",
    durationMinutes: 120,
    posterUrl: "https://example.com/poster.jpg",
    releaseDate: "2026-01-15",
  });
  assert.deepEqual(body.data.movie, {
    id: 7,
    title: "The Test Film",
    description: "A movie for API tests",
    language: "English",
    genre: "Drama",
    durationMinutes: 120,
    posterUrl: "https://example.com/poster.jpg",
    releaseDate: "2026-01-15",
  });
});

test("admin updates a movie and returns the updated movie", async () => {
  let update;
  User.findById = async () => ({ id: "42", role: "admin" });
  Movie.updateMovie = async (id, fields) => {
    update = { id, fields };
    return { ...movieRow, title: "Updated Film" };
  };

  const response = await sendJson("/api/admin/movies/7", "PUT", {
    title: "Updated Film",
  }, accessCookie("admin"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(update, { id: 7, fields: { title: "Updated Film" } });
  assert.equal(body.data.movie.title, "Updated Film");
  assert.equal(body.data.movie.durationMinutes, 120);
});

test("admin movie endpoints reject requests without authentication", async () => {
  const response = await sendJson("/api/admin/movies", "POST", {}, undefined);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "UNAUTHENTICATED");
});

test("admin movie endpoints reject authenticated non-admin users", async () => {
  User.findById = async () => ({ id: "42", role: "user" });

  const response = await sendJson("/api/admin/movies/7", "PUT", {
    title: "Updated Film",
  }, accessCookie("user"));
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.error.code, "FORBIDDEN");
});

test("movie creation rejects invalid input without calling the repository", async () => {
  let createCalled = false;
  User.findById = async () => ({ id: "42", role: "admin" });
  Movie.createMovie = async () => {
    createCalled = true;
    return movieRow;
  };

  const response = await sendJson("/api/admin/movies", "POST", {
    title: "",
    language: "English",
    durationMinutes: 120,
  }, accessCookie("admin"));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(createCalled, false);
});

test("movie updates reject empty input and invalid ids", async (context) => {
  User.findById = async () => ({ id: "42", role: "admin" });

  await context.test("empty update", async () => {
    const response = await sendJson("/api/admin/movies/7", "PUT", {}, accessCookie("admin"));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  await context.test("non-numeric id", async () => {
    const response = await sendJson("/api/admin/movies/not-an-id", "PUT", {
      title: "Updated Film",
    }, accessCookie("admin"));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

test("updating a missing movie returns a not-found error", async () => {
  User.findById = async () => ({ id: "42", role: "admin" });
  Movie.updateMovie = async () => null;

  const response = await sendJson("/api/admin/movies/999", "PUT", {
    title: "Updated Film",
  }, accessCookie("admin"));
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "MOVIE_NOT_FOUND");
});

const env = require("../config/env");
const { pool } = require("../config/database");
const { withTransaction } = require("../utils/transaction");
const showRepo = require("../repositories/show.repository");

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS = 3;

const MOVIES = [
  { title: "Inception", description: "A skilled thief enters people's dreams to steal their secrets.", language: "English", genre: "Sci-Fi", durationMinutes: 148, releaseDate: "2010-07-16" },
  { title: "Interstellar", description: "Explorers travel through a wormhole in search of a new home for humanity.", language: "English", genre: "Sci-Fi", durationMinutes: 169, releaseDate: "2014-11-07" },
  { title: "The Dark Knight", description: "Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into chaos.", language: "English", genre: "Action", durationMinutes: 152, releaseDate: "2008-07-18" },
  { title: "3 Idiots", description: "Three engineering students navigate friendship, pressure, and a very different idea of learning.", language: "Hindi", genre: "Comedy", durationMinutes: 170, releaseDate: "2009-12-25" },
  { title: "Dangal", description: "A former wrestler trains his daughters to become champions.", language: "Hindi", genre: "Drama", durationMinutes: 161, releaseDate: "2016-12-23" },
  { title: "Drishyam", description: "A family man goes to great lengths to protect his family after a crime.", language: "Hindi", genre: "Thriller", durationMinutes: 163, releaseDate: "2015-07-31" },
];

const THEATRES = [
  { name: "PVR Select Citywalk", city: "Delhi", address: "Saket, New Delhi", screens: ["Screen 1", "Screen 2"] },
  { name: "INOX Nehru Place", city: "Delhi", address: "Nehru Place, New Delhi", screens: ["Screen 1", "Screen 2"] },
  { name: "PVR Phoenix Marketcity", city: "Mumbai", address: "Kurla West, Mumbai", screens: ["Screen 1", "Screen 2"] },
];

const SEAT_ROWS = [
  { rowLabel: "A", seatCount: 12, category: "silver" },
  { rowLabel: "B", seatCount: 12, category: "silver" },
  { rowLabel: "C", seatCount: 12, category: "silver" },
  { rowLabel: "D", seatCount: 12, category: "gold" },
  { rowLabel: "E", seatCount: 12, category: "gold" },
  { rowLabel: "F", seatCount: 12, category: "gold" },
  { rowLabel: "G", seatCount: 8, category: "premium" },
  { rowLabel: "H", seatCount: 8, category: "premium" },
];

const PRICES = [
  { category: "silver", price: 150 },
  { category: "gold", price: 220 },
  { category: "premium", price: 350 },
];

// slots are 4.5h apart, longer than the longest movie, so shows never overlap
const SLOTS = [
  { h: 10, m: 0 },
  { h: 14, m: 30 },
  { h: 19, m: 0 },
];

// midnight tomorrow in IST, as a timestamp
const tomorrowMidnightIst = () => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); // YYYY-MM-DD
  return new Date(`${today}T00:00:00+05:30`).getTime() + DAY_MS;
};

const insertSeats = async (db, screenId) => {
  const seats = SEAT_ROWS.flatMap((r) =>
    Array.from({ length: r.seatCount }, (_, i) => ({
      rowLabel: r.rowLabel,
      seatNumber: i + 1,
      category: r.category,
    }))
  );
  await db.query(
    `INSERT INTO seats (screen_id, row_label, seat_number, category)
     SELECT $1::bigint, t.row_label, t.seat_number, t.category
     FROM unnest($2::text[], $3::int[], $4::text[]) AS t(row_label, seat_number, category)`,
    [
      screenId,
      seats.map((s) => s.rowLabel),
      seats.map((s) => s.seatNumber),
      seats.map((s) => s.category),
    ]
  );
  return seats.length;
};

const seed = () =>
  withTransaction(async (db) => {
    // wipe catalog and booking data; users are not listed, so they are kept
    await db.query(
      `TRUNCATE webhook_events, refunds, payments, booking_seats, bookings,
                show_seat_prices, shows, seats, screens, theatres, movies
       RESTART IDENTITY CASCADE`
    );

    const movies = [];
    for (const m of MOVIES) {
      const { rows } = await db.query(
        `INSERT INTO movies (title, description, language, genre, duration_minutes, release_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, duration_minutes`,
        [m.title, m.description, m.language, m.genre, m.durationMinutes, m.releaseDate]
      );
      movies.push({ id: rows[0].id, durationMinutes: rows[0].duration_minutes });
    }

    const screenIds = [];
    let seatCount = 0;
    for (const t of THEATRES) {
      const { rows: theatreRows } = await db.query(
        `INSERT INTO theatres (name, city, address) VALUES ($1, $2, $3) RETURNING id`,
        [t.name, t.city, t.address]
      );
      for (const screenName of t.screens) {
        const { rows: screenRows } = await db.query(
          `INSERT INTO screens (theatre_id, name) VALUES ($1, $2) RETURNING id`,
          [theatreRows[0].id, screenName]
        );
        seatCount += await insertSeats(db, screenRows[0].id);
        screenIds.push(screenRows[0].id);
      }
    }

    const firstDay = tomorrowMidnightIst();
    let showCount = 0;
    for (let s = 0; s < screenIds.length; s++) {
      for (let d = 0; d < DAYS; d++) {
        for (let k = 0; k < SLOTS.length; k++) {
          const movie = movies[(s + d + k) % movies.length]; // rotate movies
          const start = firstDay + d * DAY_MS + (SLOTS[k].h * 60 + SLOTS[k].m) * 60000;
          const end = start + movie.durationMinutes * 60000;
          const show = await showRepo.insertShow(db, {
            movieId: movie.id,
            screenId: screenIds[s],
            startTime: new Date(start),
            endTime: new Date(end),
          });
          await showRepo.insertPrices(db, show.id, PRICES);
          showCount++;
        }
      }
    }

    return {
      movies: movies.length,
      theatres: THEATRES.length,
      screens: screenIds.length,
      seats: seatCount,
      shows: showCount,
    };
  });

const main = async () => {
  try {
    if (env.isProd) {
      throw new Error("Refusing to seed in production");
    }
    console.log("Seeding: this wipes movies, theatres, screens, seats, shows and bookings (users are kept)...");
    const summary = await seed();
    console.log("Seed complete:", summary);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end(); // lets the script exit
  }
};

main();
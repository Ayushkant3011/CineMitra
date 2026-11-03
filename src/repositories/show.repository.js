const insertShow = async(db, {movieId, screenId, startTime, endTime }) =>{
    const { rows } = await db.query(
        ` INSERT INTO shows (movie_id, screen_id, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        RETURNING id, movie_id, screen_id, start_time, end_time, status`,
        [movieId, screenId, startTime, endTime]
    );
    return rows[0];
};

const insertPrices = async(db, showId, prices) =>{
    await db.query(
        `INSERT INTO show_seat_prices (show_id, category, price)
        SELECT $1::bigint, t.category, t.price
        FROM unnest($2::text[], $3::numeric[]) AS t(category, price)`,
        [showId, prices.map((p)=>p.category), prices.map((p)=> p.price)]
    );
};


const movieExists = async(db, id) =>
    (await db.query("SELECT 1 FROM movies WHERE id = $1", [id])).rowCount > 0;


const screenExists = async(db, id) =>
    (await db.query("SELECT 1 FROM screens WHERE id = $1", [id])).rowCount > 0;


const seatCategoriesForScreen = async(db, screenId) =>{
    const { rows } = await db.query(
        "SELECT DISTINCT category FROM seats WHERE screen_id = $1",
        [screenId]
    );
    return rows.map((r) => r.category);
}


const lockShowById = async(db, id) =>{
    const { rows } = await db.query(
        `SELECT id, movie_id, screen_id, start_time, end_time, status
        FROM shows
        WHERE id = $1
        FOR UPDATE`,
        [id]
    )

    return rows[0] || null;
};

const hasActiveBookings = async(db, showId) =>{
    const { rowCount } = await db.query(
        `SELECT 1 FROM booking_seats
        WHERE show_id= $1
        AND (status = 'confirmed' OR (status = 'held' AND held_until > now()))
        LIMIT 1`,
        [showId]
    );

    return rowCount>0;
};

const updateShow = async(db ,id, { startTime, endTime, status }) =>{
    const { rows } = await db.query(
        `UPDATE shows
        SET start_time = $1, end_time = $2, status = COALESCE($3, status)
        WHERE id = $4
        RETURNING id, movie_id, screen_id, start_time, end_time, status`,
        [startTime, endTime, status ?? null, id]
    );

    return rows[0];
};


const getPrices = async(db, showId) =>{
    const { rows } = await db.query(
        `SELECT category, price::float8 AS price
        FROM show_seat_prices
        WHERE show_id = $1
        ORDER BY category`,
        [showId]
    );

    return rows;
};

module.exports = {
    insertShow, insertPrices, movieExists, screenExists, seatCategoriesForScreen,
    lockShowById, hasActiveBookings, updateShow, getPrices
};


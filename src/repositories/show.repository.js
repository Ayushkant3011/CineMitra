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



module.exports = {
    insertShow, insertPrices, movieExists, screenExists, seatCategoriesForScreen,
};


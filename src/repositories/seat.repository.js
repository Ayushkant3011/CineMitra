const { pool } = require("../config/database");

const createSeats = async( screenId, seats) =>{
    const result = await pool.query(
        `INSERT INTO seats (screen_id, row_label, seat_number, category)
        SELECT $1::bigint, t.row_label, t.seat_number, t.category
        FROM unnest($2::text[], $3::int[], $4::text[]) 
            AS t(row_label, seat_number, category)`,
        [
            screenId, 
            seats.map((s) => s.rowLabel),
            seats.map((s) => s.seatNumber),
            seats.map((s) => s.category),
        ]
    );
    return result.rowCount;
};

module.exports = { createSeats };
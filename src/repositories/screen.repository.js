const { pool } = require("../config/database");

const createScreen = async( { theatreId, name} ) =>{
    const { rows } = await pool.query(
        `INSERT INTO screens (theatre_id, name)
        VALUES ($1, $2)
        RETURNING id, theatre_id, name`,
        [theatreId, name]
    );
    return rows[0];
};


module.exports = { createScreen };
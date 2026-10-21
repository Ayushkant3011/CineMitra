const { pool } = require("../config/database");

const createTheatre = async( {name, city, address } ) =>{
    const { rows } = await pool.query(
        `INSERT INTO theatres (name, city, address)
        VALUES ($1, $2, $3)
        RETURNING id, name, city, address`,
        [name, city, address]
    );
    return rows[0];
};


module.exports = { createTheatre };



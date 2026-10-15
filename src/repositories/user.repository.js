const { pool } = require("../config/database");

const createUser = async({ firstName, lastName, email, passwordHash }) =>{
    
    const { rows } = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, first_name, last_name, email, role`,
        [firstName, lastName, email, passwordHash]
    );

    return rows[0];
};

module.exports = { createUser };
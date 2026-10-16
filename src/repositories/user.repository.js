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

const findByEmail = async(email) =>{
    const { rows } = await pool.query(
        `SELECT id, first_name, last_name, email, password_hash, role
        FROM users
        WHERE email=$1`,
        [email]
    );

    return rows[0] || null;
}

const findById = async(id)=>{
    const { rows } = await pool.query(
        `SELECT id, first_name, last_name, email, role, created_at
        FROM users
        WHERE id = $1`,
        [id]
    )
    return rows[0] || null;
}

module.exports = { createUser, findByEmail, findById };
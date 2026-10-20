const { pool } = require("../config/database");

const COLUMNS = `id, title, description, language, genre, duration_minutes, poster_url, 
                release_date::text AS release_date`;


const COLUMN_MAP = {
    title: "title",
    description: "description",
    language: "language",
    genre: "genre",
    durationMinutes: "duration_minutes",
    posterUrl: "poster_url",
    releaseDate: "release_date"
}

const createMovie = async(m) =>{
    const { rows } = await pool.query(
        `INSERT INTO movies
        (title, description, language, genre, duration_minutes, poster_url, release_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${COLUMNS}`,
        [
            m.title,
            m.description ?? null,
            m.language,
            m.genre ?? null,
            m.durationMinutes,
            m.poisterUrl ?? null,
            m.releaseDate ?? null,
        ]
    );

    return rows[0];
};


const updateMovie = async(id, fields) =>{
    const keys = Object.keys(fields).filter((k) => COLUMN_MAP[k]);
    const setClause = keys.map((k, i) => `${COLUMN_MAP[k]} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const { rows } = await pool.query(
        `UPDATE movies
        SET ${setClause} WHERE id = $${keys.length + 1} RETURNING ${COLUMNS}`,
        [...values, id]
    );
    return rows[0] || null;
};


module.exports = { createMovie, updateMovie };
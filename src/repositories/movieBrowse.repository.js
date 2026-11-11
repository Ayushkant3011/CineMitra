const { pool } = require("../config/database");



// Escape LIKE wildcards so user input like "50%" is matched literally
function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

const MOVIE_COLUMNS = `
  m.id,
  m.title,
  m.description,
  m.language,
  m.genre,
  m.duration_minutes AS "durationMinutes",
  m.poster_url AS "posterUrl",
  to_char(m.release_date, 'YYYY-MM-DD') AS "releaseDate"`;

// Cities where this movie has upcoming scheduled shows ([] if none)
const CITIES_COLUMN = `
  ARRAY(
    SELECT DISTINCT t.city::text
    FROM shows s
    JOIN screens sc ON sc.id = s.screen_id
    JOIN theatres t ON t.id = sc.theatre_id
    WHERE s.movie_id = m.id
      AND s.status = 'scheduled'
      AND s.start_time > now()
    ORDER BY t.city::text
  ) AS cities`;


function buildFilters({city, language, genre, search}){
    const conditions = [];
    const params = [];

    if(language) {
        params.push(language);
        conditions.push(`lower(m.language) = lower($${params.length})`)
    }

    if(genre){
        params.push(genre);
        conditions.push(`m.genre ILIKE $${params.length}`)
    }

    if(search){
        params.push(search)
        conditions.push(`m.title ILIKE $${params.length}`)
    }

    if (city) {
        params.push(city);
        conditions.push(`EXISTS (
        SELECT 1
        FROM shows s
        JOIN screens sc ON sc.id = s.screen_id
        JOIN theatres t ON t.id = sc.theatre_id
        WHERE s.movie_id = m.id
            AND s.status = 'scheduled'
            AND s.start_time > now()
            AND lower(t.city) = lower($${params.length})
        )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return {where, params};

}

async function findMovies(filters, limit, offset){
    try{
        const { where, params } = buildFilters(filters);
        const limitIndex = params.length + 1;
        const offsetIndex = params.length + 2;


        const { rows } = await pool.query(
            `SELECT ${MOVIE_COLUMNS}, ${CITIES_COLUMN}
            FROM movie as m
            ${where}
            ORDER BY m.release_date DESC NULLS LAST, m.id DESC
            LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            [...params, limit, offset]
        );

        return rows;
    }
    catch(err){
        throw err;
    }
}

async function countMovies(filters){
    try{
        const { where, params } = buildFilters(filters);
        const { rows } = await pool.query(
            `SELECT count(*)::int AS total FROM movies m ${where}`,
            params
        );

        return rows[0].total;
    }catch(err){
        throw err;
    }
}


async function findMovieById(id){
    try{
        const { rows } = await pool.query(
            `SELECT ${MOVIE_COLUMNS}, ${CITIES_COLUMN}
            FROM movies m
            WHERE m.id = $1`,
            [id]
        );

        return rows[0] || null;
    }catch(err){
        throw err;
    }
}


module.exports = { findMovies, countMovies, findMovieById };
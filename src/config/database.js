const {Pool, Query} = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max:10,
});

pool.on("error", (err)=>{
    console.log("Unexpected Postgres Error", err);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
}
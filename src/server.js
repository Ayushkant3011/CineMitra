require("dotenv").config();
const app = require("./app");
const { pool } = require("./config/database");

const PORT = process.env.PORT || 3005;

const start = async()=>{
    try{
        await pool.query("SELECT 1");
        console.log("Database Connected Successfully!");
    }
    catch(err){
        console.log("Database connection Failed!!!", err.message);
        process.exit(1);
    }

    app.listen(PORT, ()=>{
    console.log(`CineMitra Server is running and listening on ${PORT}`);
});
};



start()


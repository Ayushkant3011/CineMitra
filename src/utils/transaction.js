const pool = require("../config/database");

const withTransaction = async(fn) =>{
    try{
        const client = await pool.connect();
        try{
            await client.query("BEGIN");
            const res = await fn(client);
            await client.query("COMMIT");
            return res;
        }
        catch(err){
            await client.query("ROLLBACK");
            throw err;
        }
        finally{
            client.release();
        }
    }
    catch(err){
        console.log("Transaction Error", err);
    }
};


module.exports = { withTransaction };
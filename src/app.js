const express = require("express")
const app = express();

const cors = require("cors")
const helmet = require("helmet")


app.use(helmet());
app.use(cors({
    origin:process.env.CLIENT_URL
}));

app.use(express.json());


app.get("/health", (req, res)=>{
    res.json({ status:"ok", service:"cinemitra-api"});
});


// 404 For unknown Routes
app.use((req,res) =>{
    res.status(404).json({error: "Route not Found!!!!"});
});


app.use((err, req, res, next) =>{
    console.log(err);

    res.status(err.status || 500).json({err: err.message || "Internal Server Error"});
});



module.exports = app;
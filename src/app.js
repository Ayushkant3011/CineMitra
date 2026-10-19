const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const cookieParser = require("cookie-parser");
const env = require("./config/env");

const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({
    origin:env.clientUrl,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");


app.get("/health", (req, res)=>{
    res.json({ status:"ok", service:"cinemitra-api"});
});

app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", adminRouter);
// 404 For unknown Routes
app.use((req,res) =>{
    res.status(404).json({error: "Route not Found!!!!"});
});


// app.use((err, req, res, next) =>{
//     console.log(err);

//     res.status(err.status || 500).json({err: err.message || "Internal Server Error"});
// });

app.use(errorHandler);

module.exports = app;
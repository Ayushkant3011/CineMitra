const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../repositories/user.repository");
const AppError = require("../utils/AppError");


const userAuth = async(req, res, next) =>{
    try{
        const token = req.cookies.access_token;

        if(!token) throw new AppError(401, "UNAUTHENTICATED", "Please Log In!!! - No Token");

        const payload = await jwt.verify(token, env.jwtAccessSecret);

        const user = await User.findById( payload.sub );

        if(!user) throw new AppError(401, "UNAUTHENTICATED", "Please Log In!!! - No User");

        req.user = user;

        next();
    }catch (err) {
        if (err.name === "TokenExpiredError") {
        return next(new AppError(401, "TOKEN_EXPIRED", "Session expired"));
        }
        if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
        return next(new AppError(401, "INVALID_TOKEN", "Invalid token"));
        }
        next(err);
    }
};


module.exports = { userAuth };
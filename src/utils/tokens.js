const jwtToken = require("jsonwebtoken");
const env = require("../config/env");
const { path } = require("../app");

const signAccessToken = (user) =>{
    jwt.sign({role: user.role,}, env.jwtAccessSecret,{
        subject: String(user.id),
        expiresIn: "30m",
    });
};

const signRefreshToken = (user)=>{
    jwt.sign({}, env.jwtRefreshSecret,{
        subject: String(user.id),
        expiresIn: "7d",
    });
};

const base = {
    httpOnlt: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
};

const setAuthCookies = (res, {accessToken , refreshToken}) =>{
    res.cookie("access_token", accessToken, {
        ...base, path:"/", maxAge: 30 * 60 * 1000
    });

    res.cookie("refresh_token", refreshToken, {
        ...base, path: "/api/refresh", maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

module.exports = { signAccessToken, signRefreshToken, setAuthCookies }
const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { getProfile } = require("../controllers/user");

userRouter.get("/profile", userAuth, getProfile);


module.exports = userRouter;
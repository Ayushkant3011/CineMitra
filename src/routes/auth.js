const express = require("express")
const authRouter = express.Router();
const { validate } = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../utils/validation");
const { signup, login, getProfile } = require("../controllers/auth");
const { userAuth } = require("../middlewares/auth");





authRouter.post("/signup", validate(signupSchema), signup);

authRouter.post("/login", validate(loginSchema), login);

authRouter.get("/profile", userAuth, getProfile);

module.exports = authRouter;
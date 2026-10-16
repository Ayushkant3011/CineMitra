const express = require("express")
const authRouter = express.Router();
const { validate } = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../utils/validation");
const { signup, login, logout } = require("../controllers/auth");



authRouter.post("/signup", validate(signupSchema), signup);

authRouter.post("/login", validate(loginSchema), login);

authRouter.post("/logout", logout);

module.exports = authRouter;
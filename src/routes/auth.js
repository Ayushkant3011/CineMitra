const express = require("express")
const authRouter = express.Router();
const { validate } = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../utils/validation");
const { signup, login } = require("../controllers/auth");

authRouter.post("/signup", validate(signupSchema), signup);

authRouter.post("/login", validate(loginSchema), login)

module.exports = authRouter;
const express = require("express")
const authRouter = express.Router();
const { validate } = require("../middlewares/validate");
const { signupSchema } = require("../utils/validation");
const { signup } = require("../controllers/auth");

authRouter.post("/signup", validate(signupSchema), signup);

module.exports = authRouter;
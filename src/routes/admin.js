const express = require("express");
const adminRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");


adminRouter.use("/admin", userAuth, requireRole("admin"));



module.exports = adminRouter;
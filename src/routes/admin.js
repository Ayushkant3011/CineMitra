const express = require("express");
const adminRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const { movieSchema, movieUpdateSchema } = require("../utils/validation");
const { createMovie, updateMovie } = require("../controllers/admin");

adminRouter.use("/admin", userAuth, requireRole("admin"));

adminRouter.post("/admin/movies", validate(movieSchema), createMovie);

adminRouter.put("/admin/movies/:id", validate(movieUpdateSchema), updateMovie);


module.exports = adminRouter;
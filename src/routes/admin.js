const express = require("express");
const adminRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { validate } = require("../middlewares/validate");
const { movieSchema, movieUpdateSchema, theatreSchema, screenSchema } = require("../utils/validation");
const { createMovie, updateMovie, createTheatre, createScreen } = require("../controllers/admin");

adminRouter.use("/admin", userAuth, requireRole("admin"));

adminRouter.post("/admin/movies", validate(movieSchema), createMovie);

adminRouter.put("/admin/movies/:id", validate(movieUpdateSchema), updateMovie);

adminRouter.post("/admin/theatres", validate(theatreSchema), createTheatre);

adminRouter.post("/admin/screens", validate(screenSchema), createScreen);

module.exports = adminRouter;
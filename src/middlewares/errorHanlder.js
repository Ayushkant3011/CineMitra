const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "Invalid JSON body", code: "BAD_JSON" } });
  }
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL" } });
};

module.exports = { errorHandler };
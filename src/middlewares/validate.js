const AppError = require("../utils/AppError");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return next(new AppError(400, "VALIDATION_ERROR", `${issue.path.join(".")}: ${issue.message}`));
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
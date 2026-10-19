const AppError = require("../utils/AppError");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".");
    const message = field ? `${field}: ${issue.message}` : issue.message;
    return next(new AppError(400, "VALIDATION_ERROR", message));
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
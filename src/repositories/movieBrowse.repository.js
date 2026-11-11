const { pool } = require("../config/database");



// Escape LIKE wildcards so user input like "50%" is matched literally
function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}
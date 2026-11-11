const { z } = require("zod");

const optionalText = z.string().trim().min(1).max(100).optional();

const listMoviesQuery = z.object({
  city: optionalText,
  language: optionalText,
  genre: optionalText,
  search: optionalText,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// bigint ids: digits only, max 18 digits so it can never overflow bigint
const idParams = z.object({
  id: z.string().regex(/^\d{1,18}$/, "id must be a positive number"),
});

module.exports = { listMoviesQuery, idParams };
const { z } = require("zod");

const signupSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72)
     .regex(/[A-Za-z]/, "must contain a letter")
     .regex(/\d/, "must contain a number"), // bcrypt ignores bytes past 72
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});


const movieSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  language: z.string().trim().min(1).max(50),
  genre: z.string().trim().max(100).optional(),
  durationMinutes: z.number().int().positive().max(600),
  posterUrl: z.string().trim().url().max(500).optional(),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD").optional(),
});

const movieUpdateSchema = movieSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "at least one field is required");



const theatreSchema = z.object({
  name: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
});

const screenSchema = z.object({
  theatreId: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
});

module.exports = { signupSchema, loginSchema, movieSchema, movieUpdateSchema,
  theatreSchema, screenSchema
 };
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



const seatLayoutSchema = z
  .object({
    screenId: z.number().int().positive(),
    rows: z
      .array(
        z.object({
          rowLabel: z.string().trim().toUpperCase().regex(/^[A-Z]{1,2}$/, "must be 1-2 letters"),
          seatCount: z.number().int().min(1).max(50),
          category: z.enum(["silver", "gold", "premium"]),
        })
      )
      .min(1)
      .max(30),
  })
  .refine(
    (d) => new Set(d.rows.map((r) => r.rowLabel)).size === d.rows.length,
    { message: "duplicate rowLabel in rows", path: ["rows"] }
  );


const showSchema = z
  .object({
    movieId: z.number().int().positive(),
    screenId: z.number().int().positive(),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    prices: z
      .array(
        z.object({
          category: z.enum(["silver", "gold", "premium"]),
          price: z.number().positive().max(100000).multipleOf(0.01),
        })
      )
      .min(1)
      .max(3),
  })
  .refine((d) => Date.parse(d.endTime) > Date.parse(d.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  })
  .refine((d) => new Set(d.prices.map((p) => p.category)).size === d.prices.length, {
    message: "duplicate category in prices",
    path: ["prices"],
  });


module.exports = { signupSchema, loginSchema, movieSchema, movieUpdateSchema,
  theatreSchema, screenSchema, seatLayoutSchema, showSchema
};
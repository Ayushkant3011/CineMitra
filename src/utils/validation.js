const { z } = require("zod");

const signupSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72)
     .regex(/[A-Za-z]/, "must contain a letter")
     .regex(/\d/, "must contain a number"), // bcrypt ignores bytes past 72
});

module.exports = { signupSchema };
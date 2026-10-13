require("dotenv").config();

const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

module.exports = {
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3000,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  clientUrl: process.env.CLIENT_URL,
};
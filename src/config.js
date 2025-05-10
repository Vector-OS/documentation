export const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number.parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "0.0.0.0",
    logLevel: process.env.LOG_LEVEL || "info",
    databaseUrl: process.env.DATABASE_URL || "",
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: "24h",
    passwordSaltRounds: 10,
    adminSecretCode: process.env.ADMINSECRETCODE || "lol",
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : ["http://localhost:3000"],
};

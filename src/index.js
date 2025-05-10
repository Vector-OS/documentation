import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import projectRoutes from "./routes/project.routes.js";
import authController from "./controllers/auth.controller.js";
import blogController from "./controllers/blog.controller.js";
import projectController from "./controllers/project.controller.js";

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport:
      config.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
  },
});
// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors, {
  origin: config.corsOrigins,
  credentials: true,
});
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "1 minute",
});
fastify.register(fastifyJwt, {
  secret: config.jwtSecret,
});
// Create database connection
const sql = neon(config.databaseUrl);
export const db = drizzle(sql);
// Register authentication decorator
fastify.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});
// Register controllers
fastify.register(authController);
fastify.register(blogController);
fastify.register(projectController);
// Health check route
fastify.get("/", async () => {
  return { status: "ok" };
});
// Register routes
fastify.register(authRoutes);
fastify.register(blogRoutes);
fastify.register(projectRoutes);
// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

import Fastify from "fastify"
import fastifyJwt from "@fastify/jwt"
import fastifyCors from "@fastify/cors"
import fastifyHelmet from "@fastify/helmet"
import fastifyRateLimit from "@fastify/rate-limit"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

import { authRoutes } from "./routes/auth.routes"
import { blogRoutes } from "./routes/blog.routes"
import { projectRoutes } from "./routes/project.routes"
import { config } from "./config"

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
  },
})

// Register plugins
fastify.register(fastifyHelmet)
fastify.register(fastifyCors, {
  origin: config.corsOrigins,
  credentials: true,
})
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "1 minute",
})
fastify.register(fastifyJwt, {
  secret: config.jwtSecret,
})

// Create database connection
const sql = neon(config.databaseUrl)
export const db = drizzle(sql)

// Register authentication decorator
fastify.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" })
  }
})

// Register routes
fastify.register(authRoutes, { prefix: "/api/auth" })
fastify.register(blogRoutes, { prefix: "/api/blog" })
fastify.register(projectRoutes, { prefix: "/api/projects" })

// Health check route
fastify.get("/", async () => {
  return { status: "ok" }
})

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

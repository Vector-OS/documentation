import type { FastifyInstance } from "fastify"
import { projectController } from "../controllers/project.controller"
import {
  projectSchema,
  getProjectsQuerySchema,
  projectParamsSchema,
  projectSlugParamsSchema,
} from "../schemas/project.schema"

export async function projectRoutes(fastify: FastifyInstance) {
  // Get all projects (public)
  fastify.get("/", { schema: getProjectsQuerySchema }, projectController.getAllProjects)

  // Get a single project by slug (public)
  fastify.get("/:slug", { schema: projectSlugParamsSchema }, projectController.getProjectBySlug)

  // Create a new project (admin only)
  fastify.post(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: projectSchema,
    },
    projectController.createProject,
  )

  // Update a project (admin only)
  fastify.put(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: { ...projectSchema, ...projectParamsSchema },
    },
    projectController.updateProject,
  )

  // Delete a project (admin only)
  fastify.delete(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: projectParamsSchema,
    },
    projectController.deleteProject,
  )
}

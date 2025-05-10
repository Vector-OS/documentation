import {
  projectSchema,
  getProjectsQuerySchema,
  projectParamsSchema,
  projectSlugParamsSchema,
} from "../schemas/project.schema.js";
import fp from "fastify-plugin";


async function projectRoutes(fastify) {
  // Get all projects (public)
  fastify.get(
    "/projects",
    { schema: getProjectsQuerySchema },
    fastify.projectController.getAllProjects
  );
  // Get a single project by slug (public)
  fastify.get(
    "/projects/:slug",
    { schema: projectSlugParamsSchema },
    fastify.projectController.getProjectBySlug
  );
  // Create a new project (admin only)
  fastify.post(
    "/projects",
    {
      preHandler: fastify.authenticate,
      schema: projectSchema,
    },
    fastify.projectController.createProject
  );
  // Update a project (admin only)
  fastify.put(
    "/projects/:id",
    {
      preHandler: fastify.authenticate,
      schema: { ...projectSchema, ...projectParamsSchema },
    },
    fastify.projectController.updateProject
  );
  // Delete a project (admin only)
  fastify.delete(
    "/projects/:id",
    {
      preHandler: fastify.authenticate,
      schema: projectParamsSchema,
    },
    fastify.projectController.deleteProject
  );
}

export default fp(projectRoutes);

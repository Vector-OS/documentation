import { eq, desc, and, sql } from "drizzle-orm";
import { projects } from "../db/schema.js";
import { db } from "../index.js";
import { generateSlug } from "../utils/slug.js";
import fp from "fastify-plugin";

const handlers = {
  async getAllProjects(request, reply) {
    try {
      const { limit = "10", offset = "0", featured } = request.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      let conditions = sql`1=1`;
      if (featured === "true") {
        conditions = and(conditions, eq(projects.featured, true));
      } else if (featured === "false") {
        conditions = and(conditions, eq(projects.featured, false));
      }
      const projectsList = await db
        .select()
        .from(projects)
        .where(conditions)
        .orderBy(desc(projects.order), desc(projects.createdAt))
        .limit(limitNum)
        .offset(offsetNum);
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(projects)
        .where(conditions);
      return {
        projects: projectsList,
        meta: {
          total: Number(count),
          limit: limitNum,
          offset: offsetNum,
        },
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async getProjectBySlug(request, reply) {
    try {
      const { slug } = request.params;
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);
      if (!project) {
        return reply.code(404).send({ error: "Project not found" });
      }
      return { project };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async createProject(request, reply) {
    try {
      const projectData = request.body;
      const authorId = parseInt(request.user.id, 10);
      let slug = projectData.slug || generateSlug(projectData.title);
      const existingSlug = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);
      if (existingSlug.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
      const now = new Date();
      const [newProject] = await db
        .insert(projects)
        .values({
          title: projectData.title,
          slug,
          description: projectData.description,
          imageUrl: projectData.imageUrl,
          projectUrl: projectData.projectUrl,
          githubUrl: projectData.githubUrl,
          featured: projectData.featured ?? false,
          order: projectData.order ?? 0,
          authorId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return {
        message: "Project created successfully",
        project: newProject,
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async updateProject(request, reply) {
    try {
      const projectId = parseInt(request.params.id, 10);
      if (isNaN(projectId)) {
        return reply.code(400).send({ error: "Invalid project ID" });
      }

      const projectData = request.body;

      const [existingProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!existingProject) {
        return reply.code(404).send({ error: "Project not found" });
      }

      let slug = existingProject.slug;

      if (projectData.slug && projectData.slug !== existingProject.slug) {
        slug = projectData.slug.trim().toLowerCase();
      } else if (
        projectData.title &&
        projectData.title !== existingProject.title
      ) {
        slug = generateSlug(projectData.title.trim().toLowerCase());
      }

      if (slug !== existingProject.slug) {
        const slugExists = await db
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(eq(projects.slug, slug), sql`${projects.id} != ${projectId}`)
          )
          .limit(1);

        if (slugExists.length > 0) {
          slug = `${slug}-${Date.now()}`;
        }
      }

      const [updatedProject] = await db
        .update(projects)
        .set({
          title: projectData.title,
          slug,
          description: projectData.description,
          imageUrl: projectData.imageUrl,
          projectUrl: projectData.projectUrl,
          githubUrl: projectData.githubUrl,
          featured: projectData.featured,
          order: projectData.order,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();

      return {
        message: "Project updated successfully",
        project: updatedProject,
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async deleteProject(request, reply) {
    try {
      const projectId = parseInt(request.params.id, 10);
      if (isNaN(projectId)) {
        return reply.code(400).send({ error: "Invalid project ID" });
      }
      const [existingProject] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      if (!existingProject) {
        return reply.code(404).send({ error: "Project not found" });
      }
      await db.delete(projects).where(eq(projects.id, projectId));
      return { message: "Project deleted successfully" };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
};
const projectController = async (fastify) => {
  fastify.decorate("projectController", handlers);
};
export default fp(projectController);

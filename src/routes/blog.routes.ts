import type { FastifyInstance } from "fastify"
import { blogController } from "../controllers/blog.controller"
import {
  blogPostSchema,
  getBlogPostsQuerySchema,
  blogPostParamsSchema,
  blogPostSlugParamsSchema,
} from "../schemas/blog.schema"

export async function blogRoutes(fastify: FastifyInstance) {
  // Get all blog posts (public)
  fastify.get("/", { schema: getBlogPostsQuerySchema }, blogController.getAllPosts)

  // Get a single blog post by slug (public)
  fastify.get("/:slug", { schema: blogPostSlugParamsSchema }, blogController.getPostBySlug)

  // Create a new blog post (admin only)
  fastify.post(
    "/",
    {
      preHandler: fastify.authenticate,
      schema: blogPostSchema,
    },
    blogController.createPost,
  )

  // Update a blog post (admin only)
  fastify.put(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: { ...blogPostSchema, ...blogPostParamsSchema },
    },
    blogController.updatePost,
  )

  // Delete a blog post (admin only)
  fastify.delete(
    "/:id",
    {
      preHandler: fastify.authenticate,
      schema: blogPostParamsSchema,
    },
    blogController.deletePost,
  )
}

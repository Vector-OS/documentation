import {
  blogPostSchema,
  getBlogPostsQuerySchema,
  blogPostParamsSchema,
  blogPostSlugParamsSchema,
} from "../schemas/blog.schema.js";
import fp from "fastify-plugin";
async function blogRoutes(fastify) {
  // Get all blog posts (public)
  fastify.get(
    "/blog",
    { schema: getBlogPostsQuerySchema },
    fastify.blogController.getAllPosts
  );
  // Get a single blog post by slug (public)
  fastify.get(
    "/blog/:slug",
    { schema: blogPostSlugParamsSchema },
    fastify.blogController.getPostBySlug
  );
  // Create a new blog post (admin only)
  fastify.post(
    "/blog",
    {
      preHandler: fastify.authenticate,
      schema: blogPostSchema,
    },
    fastify.blogController.createPost
  );
  // Update a blog post (admin only)
  fastify.put(
    "/blog/:id",
    {
      preHandler: fastify.authenticate,
      schema: { ...blogPostSchema, ...blogPostParamsSchema },
    },
    fastify.blogController.updatePost
  );
  // Delete a blog post (admin only)
  fastify.delete(
    "/blog/:id",
    {
      preHandler: fastify.authenticate,
      schema: blogPostParamsSchema,
    },
    fastify.blogController.deletePost
  );
}

export default fp(blogRoutes);

import { eq, desc, and, not, sql } from "drizzle-orm";
import { blogPosts } from "../db/schema.js";
import { db } from "../index.js";
import { generateSlug } from "../utils/slug.js";
import fp from "fastify-plugin";
// --- Controller Plugin ---
export const blogController = async (fastify) => {
    fastify.decorate("blogController", {
        async getAllPosts(request, reply) {
            try {
                const { limit = "10", offset = "0", published } = request.query;
                const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
                const offsetNum = Math.max(0, parseInt(offset, 10) || 0);
                let conditions = sql `1=1`;
                if (!request.user || published === "true") {
                    conditions = and(conditions, eq(blogPosts.published, true));
                }
                else if (published === "false") {
                    conditions = and(conditions, eq(blogPosts.published, false));
                }
                const posts = await db
                    .select({
                    id: blogPosts.id,
                    title: blogPosts.title,
                    slug: blogPosts.slug,
                    excerpt: blogPosts.excerpt,
                    published: blogPosts.published,
                    createdAt: blogPosts.createdAt,
                    publishedAt: blogPosts.publishedAt,
                })
                    .from(blogPosts)
                    .where(conditions)
                    .orderBy(desc(blogPosts.createdAt))
                    .limit(limitNum)
                    .offset(offsetNum);
                const [{ count }] = await db
                    .select({ count: sql `count(*)` })
                    .from(blogPosts)
                    .where(conditions);
                return {
                    posts,
                    meta: {
                        total: count,
                        limit: limitNum,
                        offset: offsetNum,
                    },
                };
            }
            catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: "Internal server error" });
            }
        },
        async getPostBySlug(request, reply) {
            try {
                const { slug } = request.params;
                const [post] = await db
                    .select()
                    .from(blogPosts)
                    .where(eq(blogPosts.slug, slug.trim().toLowerCase()))
                    .limit(1);
                if (!post || (!post.published && !request.user)) {
                    return reply.code(404).send({ error: "Blog post not found" });
                }
                return { post };
            }
            catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: "Internal server error" });
            }
        },
        async createPost(request, reply) {
            try {
                const { title, content, excerpt, published = false } = request.body;
                if (!request.user) {
                    return reply.code(401).send({ error: "Unauthorized" });
                }
                const authorId = request.user.id;
                let slug = (request.body.slug || generateSlug(title)).trim().toLowerCase();
                const existingPost = await db
                    .select({ id: blogPosts.id })
                    .from(blogPosts)
                    .where(eq(blogPosts.slug, slug))
                    .limit(1);
                if (existingPost.length > 0) {
                    slug = `${slug}-${Date.now()}`;
                }
                const now = new Date();
                const [newPost] = await db
                    .insert(blogPosts)
                    .values({
                    title,
                    slug,
                    content,
                    excerpt: excerpt || content.substring(0, 150) + "...",
                    published,
                    authorId,
                    createdAt: now,
                    updatedAt: now,
                    publishedAt: published ? now : null,
                })
                    .returning();
                return {
                    message: "Blog post created successfully",
                    post: newPost,
                };
            }
            catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: "Internal server error" });
            }
        },
        async updatePost(request, reply) {
            try {
                const { id } = request.params;
                const postId = parseInt(id, 10);
                if (isNaN(postId)) {
                    return reply.code(400).send({ error: "Invalid post ID" });
                }
        
                const { title, content, excerpt, published } = request.body;
        
                // Fetch existing post
                const [existingPost] = await db
                    .select()
                    .from(blogPosts)
                    .where(eq(blogPosts.id, postId))
                    .limit(1);
        
                if (!existingPost) {
                    return reply.code(404).send({ error: "Blog post not found" });
                }
        
                let slug = existingPost.slug;
                if (request.body.slug) {
                    slug = request.body.slug.trim().toLowerCase();
                } else if (title !== existingPost.title) {
                    // Generate slug from title if the title has changed
                    slug = generateSlug(title).trim().toLowerCase();
                }
        
                // Check if the slug already exists for another post
                const slugExists = await db
                    .select({ id: blogPosts.id })
                    .from(blogPosts)
                    .where(and(eq(blogPosts.slug, slug), not(eq(blogPosts.id, postId))))
                    .limit(1);
        
                if (slugExists.length > 0) {
                    // Append a timestamp or random string to the slug to make it unique
                    slug = `${slug}-${Date.now()}`;
                }
        
                const now = new Date();
                let publishedAt = existingPost.publishedAt;
                if (published && !existingPost.published) {
                    publishedAt = now;
                }
        
                // Update the blog post
                const [updatedPost] = await db
                    .update(blogPosts)
                    .set({
                        title,
                        slug,
                        content,
                        excerpt: excerpt || content.substring(0, 150) + "...",
                        published,
                        updatedAt: now,
                        publishedAt,
                    })
                    .where(eq(blogPosts.id, postId))
                    .returning();
        
                return {
                    message: "Blog post updated successfully",
                    post: updatedPost,
                };
            } catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: "Internal server error" });
            }
        },
        async deletePost(request, reply) {
            try {
                const { id } = request.params;
                const postId = parseInt(id, 10);
                if (isNaN(postId)) {
                    return reply.code(400).send({ error: "Invalid post ID" });
                }
                const [existingPost] = await db
                    .select({ id: blogPosts.id })
                    .from(blogPosts)
                    .where(eq(blogPosts.id, postId))
                    .limit(1);
                if (!existingPost) {
                    return reply.code(404).send({ error: "Blog post not found" });
                }
                await db.delete(blogPosts).where(eq(blogPosts.id, postId));
                return { message: "Blog post deleted successfully" };
            }
            catch (error) {
                request.log.error(error);
                return reply.code(500).send({ error: "Internal server error" });
            }
        },
    });
};
export default fp(blogController);

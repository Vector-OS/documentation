import { pgTable, serial, text, timestamp, boolean, varchar, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// Admin users table
export const admins = pgTable("admins", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastLogin: timestamp("last_login"),
    active: boolean("active").default(true).notNull(),
});
// Blog posts table
export const blogPosts = pgTable("blog_posts", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    published: boolean("published").default(false).notNull(),
    authorId: integer("author_id")
        .notNull()
        .references(() => admins.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
});
// Project showcase table
export const projects = pgTable("projects", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    projectUrl: text("project_url"),
    githubUrl: text("github_url"),
    featured: boolean("featured").default(false).notNull(),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    authorId: integer("author_id")
        .notNull()
        .references(() => admins.id, { onDelete: "cascade" }),
});
// Define relations
export const adminsRelations = relations(admins, ({ many }) => ({
    blogPosts: many(blogPosts),
    projects: many(projects),
}));
export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
    author: one(admins, {
        fields: [blogPosts.authorId],
        references: [admins.id],
    }),
}));
export const projectsRelations = relations(projects, ({ one }) => ({
    author: one(admins, {
        fields: [projects.authorId],
        references: [admins.id],
    }),
}));

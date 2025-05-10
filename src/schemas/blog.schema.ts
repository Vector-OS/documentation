export const blogPostSchema = {
  body: {
    type: "object",
    required: ["title", "content"],
    properties: {
      title: { type: "string", minLength: 3, maxLength: 255 },
      content: { type: "string", minLength: 10 },
      excerpt: { type: "string" },
      published: { type: "boolean", default: false },
      slug: { type: "string" },
    },
  },
}

export const getBlogPostsQuerySchema = {
  querystring: {
    type: "object",
    properties: {
      limit: { type: "string", pattern: "^[0-9]+$" },
      offset: { type: "string", pattern: "^[0-9]+$" },
      published: { type: "string", enum: ["true", "false"] },
    },
  },
}

export const blogPostParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
}

export const blogPostSlugParamsSchema = {
  params: {
    type: "object",
    required: ["slug"],
    properties: {
      slug: { type: "string" },
    },
  },
}

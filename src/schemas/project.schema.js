export const projectSchema = {
    body: {
        type: "object",
        required: ["title", "description"],
        properties: {
            title: { type: "string", minLength: 3, maxLength: 255 },
            description: { type: "string", minLength: 10 },
            imageUrl: { type: "string", format: "uri" },
            projectUrl: { type: "string", format: "uri" },
            githubUrl: { type: "string", format: "uri" },
            featured: { type: "boolean", default: false },
            order: { type: "integer", default: 0 },
            slug: { type: "string" },
        },
    },
};
export const getProjectsQuerySchema = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "string", pattern: "^[0-9]+$" },
            offset: { type: "string", pattern: "^[0-9]+$" },
            featured: { type: "string", enum: ["true", "false"] },
        },
    },
};
export const projectParamsSchema = {
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", pattern: "^[0-9]+$" },
        },
    },
};
export const projectSlugParamsSchema = {
    params: {
        type: "object",
        required: ["slug"],
        properties: {
            slug: { type: "string" },
        },
    },
};

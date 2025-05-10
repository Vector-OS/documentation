export const loginSchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 3, maxLength: 50 },
            password: { type: "string", minLength: 8 },
        },
    },
};
export const registerSchema = {
    body: {
        type: "object",
        required: ["username", "password", "email"],
        properties: {
            username: { type: "string", minLength: 3, maxLength: 50 },
            password: { type: "string", minLength: 8 },
            email: { type: "string", format: "email" },
            secretCode: { type: "string"},
        },
    },
};
export const changePasswordSchema = {
    body: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
        },
    },
};

import { loginSchema, registerSchema, changePasswordSchema } from "../schemas/auth.schema.js";
import fp from "fastify-plugin";
export default fp(async function (fastify) {
    // Login route
    fastify.post("/auth/login", { schema: loginSchema }, fastify.authController.login);
    // Register route (admin only)
    fastify.post("/auth/register", {
        schema: registerSchema,
    }, fastify.authController.register);
    // Get current user info
    fastify.get("/auth/me", {
        preHandler: fastify.authenticate,
    }, fastify.authController.getProfile);
    // Change password
    fastify.put("/auth/change-password", {
        preHandler: fastify.authenticate,
        schema: changePasswordSchema,
    }, fastify.authController.changePassword);
});

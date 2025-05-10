import { eq, or } from "drizzle-orm";
import { admins } from "../db/schema.js";
import { db } from "../index.js";
import { config } from "../config.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import fp from "fastify-plugin";

const authControllerImplementation = {
  async login(request, reply) {
    try {
      const { username, password } = request.body;
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.username, username))
        .limit(1);
      if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }
      await db
        .update(admins)
        .set({ lastLogin: new Date() })
        .where(eq(admins.id, admin.id));
      const token = await reply.jwtSign(
        {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
        { expiresIn: config.jwtExpiresIn }
      );
      return reply.send({
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async register(request, reply) {
    try {
      const { username, password, email, secretCode } = request.body;
      if (!secretCode) {
        return reply.code(400).send({ error: "Unauthorized registration" });
      }
      if (secretCode !== config.adminSecretCode) {
        return reply.code(403).send({ error: "Invalid secret code" });
      }
  
      const existingAdmin = await db
        .select({ id: admins.id })
        .from(admins)
        .where(or(eq(admins.username, username), eq(admins.email, email)))
        .limit(1);
  
      if (existingAdmin.length > 0) {
        return reply
          .code(409)
          .send({ error: "Username or email already exists" });
      }
  
      const [newAdmin] = await db
        .insert(admins)
        .values({
          username,
          passwordHash: await hashPassword(password),
          email,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: admins.id,
          username: admins.username,
          email: admins.email,
          createdAt: admins.createdAt,
        });

        const token = await reply.jwtSign(
            {
              id: newAdmin.id,
              username: newAdmin.username,
              email: newAdmin.email,
            },
            { expiresIn: config.jwtExpiresIn }
          );
  
      return reply.send({
        message: "Admin created successfully",
        token,
        user: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
        },
        admin: true
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async getProfile(request, reply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const [admin] = await db
        .select({
          id: admins.id,
          username: admins.username,
          email: admins.email,
          createdAt: admins.createdAt,
          lastLogin: admins.lastLogin,
        })
        .from(admins)
        .where(eq(admins.id, userId))
        .limit(1);
      if (!admin) {
        return reply.code(404).send({ error: "Admin not found" });
      }
      return reply.send({ user: admin });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
  async changePassword(request, reply) {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, userId))
        .limit(1);
      if (!admin) {
        return reply.code(404).send({ error: "Admin not found" });
      }
      if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
        return reply.code(401).send({ error: "Current password is incorrect" });
      }
      await db
        .update(admins)
        .set({
          passwordHash: await hashPassword(newPassword),
          updatedAt: new Date(),
        })
        .where(eq(admins.id, userId));
      return reply.send({ message: "Password updated successfully" });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },
};
const authControllerPlugin = async (fastify) => {
  fastify.decorate("authController", authControllerImplementation);
};
export default fp(authControllerPlugin);

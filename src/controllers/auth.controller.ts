import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { eq, or } from "drizzle-orm";
import { admins } from "../db/schema";
import { db } from "../index";
import { config } from "../config";
import { hashPassword, verifyPassword } from "../utils/password";
import fp from "fastify-plugin";

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface JWTUser {
  id: string;
  username: string;
  email: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authController: typeof authControllerImplementation;
  }

  interface FastifyRequest {
    user?: JWTUser;
  }
}

const authControllerImplementation = {
  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) {
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

      const token = request.server.jwt.sign(
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

  async register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { username, password, email } = request.body;

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

      return reply.send({ message: "Admin created successfully", admin: newAdmin });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as JWTUser)?.id;

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

  async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = (request.user as JWTUser)?.id;

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
        return reply
          .code(401)
          .send({ error: "Current password is incorrect" });
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

const authControllerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorate("authController", authControllerImplementation);
};

export default fp(authControllerPlugin);

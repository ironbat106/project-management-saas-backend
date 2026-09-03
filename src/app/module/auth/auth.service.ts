import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import type { SignOptions } from "jsonwebtoken";
import config from "../../config/index.js";
import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { redisClient } from "../../lib/redis.js";
import { AppError } from "../../utils/AppError.js";
import { jwtUtils } from "../../utils/jwt.js";
import type { ILoginPayload, IRegisterPayload } from "./auth.interface.js";
 
const generateAuthTokens = (user: { id: string; name: string; email: string; role: Role }) => {
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
 
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions["expiresIn"],
  );
 
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions["expiresIn"],
  );
 
  return { accessToken, refreshToken };
};

const register = async (payload: IRegisterPayload) => {
  const email = payload.email.trim().toLowerCase();
 
  const existingUser = await prisma.user.findUnique({ where: { email } });
 
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "An account with this email already exists");
  }
 
  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));
 
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email,
      password: hashedPassword,
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIAL,
    },
    omit: { password: true },
  });
 
  const tokens = generateAuthTokens(user);
 
  return { user, ...tokens };
};
 
const login = async (payload: ILoginPayload) => {
  const email = payload.email.trim().toLowerCase();
 
  const user = await prisma.user.findUnique({ where: { email } });
 
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "No account found with this email");
  }
 
  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "This account has been deleted");
  }
 
  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "This account has been blocked. Please contact support.");
  }
 
  if (!user.password) {
    throw new AppError(httpStatus.BAD_REQUEST, "This account was created with Google. Please log in with Google.");
  }
 
  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
 
  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }
 
  const tokens = generateAuthTokens(user);
 
  return { needPasswordChange: user.needPasswordChange, ...tokens };
};

const REFRESH_TOKEN_BLACKLIST_PREFIX = "blacklisted-refresh-token:";
 
const refreshToken = async (token: string) => {
  const isBlacklisted = await redisClient.get(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${token}`).catch(() => null);
 
  if (isBlacklisted) {
    throw new AppError(httpStatus.UNAUTHORIZED, "This session has been logged out. Please log in again.");
  }
 
  const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);
 
  if (!verified.success || !verified.data) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }
 
  const user = await prisma.user.findUnique({ where: { id: verified.data.userId as string } });
 
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.UNAUTHORIZED, "This account is no longer active");
  }
 
  return generateAuthTokens(user);
};

const logout = async (token: string) => {
  const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);
 
  if (!verified.success || !verified.data?.exp) {
    // Already invalid/expired — nothing meaningful to blacklist.
    return null;
  }
 
  const remainingSeconds = verified.data.exp - Math.floor(Date.now() / 1000);
 
  if (remainingSeconds > 0) {
    await redisClient
      .set(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${token}`, "true", { EX: remainingSeconds })
      .catch(() => null);
  }
 
  return null;
};
 
export const AuthService = {
  register,
  login,
  refreshToken,
  logout,
};

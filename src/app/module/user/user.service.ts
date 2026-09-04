import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config/index.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type { IChangePasswordPayload, IUpdateProfilePayload } from "./user.interface.js";
 
const getMe = async (authUser: RequestUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    omit: { password: true },
  });
 
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
 
  return user;
};
 
const updateMe = async (authUser: RequestUser, payload: IUpdateProfilePayload) => {
  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: payload,
    omit: { password: true },
  });
 
  return user;
};
 
const changePassword = async (authUser: RequestUser, payload: IChangePasswordPayload) => {
  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
 
  if (!user || !user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account does not have a password set (it may be a Google-only account)",
    );
  }
 
  const isOldPasswordMatched = await bcrypt.compare(payload.oldPassword, user.password);
 
  if (!isOldPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Current password is incorrect");
  }
 
  const hashedNewPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
 
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword, needPasswordChange: false },
  });
 
  return null;
};
 
export const UserService = {
  getMe,
  updateMe,
  changePassword,
};

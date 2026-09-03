import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
 
const createToken = (payload: JwtPayload, secret: Secret, expiresIn: SignOptions["expiresIn"]) => {
  return jwt.sign(payload, secret, { expiresIn });
};
 
const verifyToken = (token: string, secret: Secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return { success: true, data: decoded as JwtPayload, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
};
 
export const jwtUtils = {
  createToken,
  verifyToken,
};
import dotenv from "dotenv";
import path from "path";
 
dotenv.config({ path: path.join(process.cwd(), ".env") });
 
export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  frontend_url: process.env.FRONTEND_URL,
 
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 10,
 
  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN as string,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN as string,
 
  google_client_id: process.env.GOOGLE_CLIENT_ID as string,
 
  admin_name: process.env.ADMIN_NAME as string,
  admin_email: process.env.ADMIN_EMAIL as string,
  admin_password: process.env.ADMIN_PASSWORD as string,
 
  redis_url: process.env.REDIS_URL as string,
 
  stripe_secret_key: process.env.STRIPE_SECRET_KEY as string,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET as string,
  stripe_pro_price_id: process.env.STRIPE_PRO_PRICE_ID as string,
  stripe_business_price_id: process.env.STRIPE_BUSINESS_PRICE_ID as string,
};

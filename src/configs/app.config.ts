import { config } from 'dotenv';
config();

const AppConfig = {
  APP: {
    NAME: 'AppRabbit API',
    PORT: Number(process.env.PORT),
    DEBUG: Boolean(process.env.DEBUG),
    LOG_LEVEL: Number(process.env.LOG_LEVEL),
    TOKEN_EXPIRATION: Number(process.env.TOKEN_EXPIRATION),
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE,
    APP_URL: process.env.APP_URL,
    FRONT_END_APP_URL: process.env.FRONT_END_APP_URL,
  },
  CRYPTO: {
    METHOD: process.env.CRYPTO_METHOD,
    SECRET_KEY: process.env.CRYPTO_SECRET_KEY,
    INITIAL_VECTOR: process.env.CRYPTO_INITIAL_VECTOR,
  },
  DATABASE: {
    URL: process.env.DATABASE_URL,
  },
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: Number(process.env.REDIS_PORT),
    USERNAME: process.env.REDIS_USERNAME,
    PASSWORD: process.env.REDIS_PASSWORD,
    CLOUD_URL: process.env.REDISCLOUD_URL,
  },
  AWS: {
    ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    SECRET_KEY: process.env.AWS_SECRET_KEY,
    REGION: process.env.AWS_REGION,
    BUCKET: process.env.AWS_BUCKET,
  },
  STRIPE: {
    PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT: process.env.GOOGLE_REDIRECT,
  },
  FIREBASE: {
    SERVICE_ACCOUNT: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
    SERVICE_ACCOUNT_SUPRA: JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_SUPRA,
    ),
    SERVICE_ACCOUNT_ATHLETIC: JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_ATHLETIC,
    ),
    SERVICE_ACCOUNT_STAGING: JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_STAGING,
    ),
    SERVICE_ACCOUNT_RADIN: JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_RADIN,
    ),
    SERVICE_ACCOUNT_RISE: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_RISE),
    SERVICE_ACCOUNT_ROB: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_ROB),
    SERVICE_ACCOUNT_TANK: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_TANK),
    SERVICE_ACCOUNT_TRABUCO: JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_TRABUCO,
    ),
    STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  },
  SENDGRID: {
    API_KEY: process.env.SENDGRID_API_KEY,
    RESET_PASSWORD_EMAIL_TEMPLATE:
      process.env.SENDGRID_RESET_PASSWORD_EMAIL_TEMPLATE,
  },
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    SERVICE_SID: process.env.TWILIO_VERIFICATION_SERVICE_SID,
  },
  ZAPIER: {
    WEBHOOK_URL: process.env.ZAPIER_WEBHOOK_URL,
  },
  GPT: {
    SECRET_KEY: process.env.GPT_SECRET_KEY,
  }
};
export default AppConfig;

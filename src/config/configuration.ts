export default () => ({
  DB: {
    PORT: process.env.DB_PORT,
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME,
    URL: process.env.DB_URL,
  },
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  PORT: process.env.PORT,
  UI_URL: process.env.UI_URL,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_IAM_ROLE_ARN: process.env.S3_IAM_ROLE_ARN,
});

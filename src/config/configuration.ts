export default () => ({
  DB: {
    PORT: process.env.DB_PORT,
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME,
  },
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT,
  UI_URL: process.env.UI_URL,
});

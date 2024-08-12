const dotenv = require("dotenv");
const logger = require("./logconfig");

const dbConfig = () => {
  const envFile = process.env.NODE_ENV.trim() === "prod" ? ".env.prod" : ".env.dev";
  dotenv.config({ path: envFile });
  const { host, user, password, database, charset } = process.env;
  return { host, user, password, database, charset };
};

module.exports = dbConfig();

const dotenv = require("dotenv");
const logger = require("./logconfig");

const dbConfig = () => {
  // const envFile = process.env.NODE_ENV === "prod" ? ".env.prod" : ".env.dev";
  logger.info(process.env.NODE_ENV)
  dotenv.config({ path: '.env.prod' });
  const { host, user, password, database, charset } = process.env;
  return { host, user, password, database, charset };
};

module.exports = dbConfig();

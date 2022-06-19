const core = require('@actions/core');
const Action = require("./src/action");

async function run() {
  try {
    const token = core.getInput("TOKEN");
    const dbUser = core.getInput("TEST_DB_USER");
    const dbPassword = core.getInput("TEST_DB_PASSWORD");
    const port = core.getInput("PORT");

    const action = new Action({ token, dbUser, dbPassword, port });

    await action.run();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

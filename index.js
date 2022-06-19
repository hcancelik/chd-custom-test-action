const core = require('@actions/core');
const Action = require("./src/action");

async function run() {
  try {
    const coverage = core.getInput('COVERAGE');
    const token = core.getInput("TOKEN");
    const dbUser = core.getInput("TEST_DB_USER");
    const dbPassword = core.getInput("TEST_DB_PASSWORD");
    const port = core.getInput("PORT");
    const coverageThreshold = core.getInput("COVERAGE_THRESHOLD");

    const action = new Action({ coverage, token, dbUser, dbPassword, port, coverageThreshold });

    await action.run();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

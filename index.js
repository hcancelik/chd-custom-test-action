const core = require('@actions/core');
const { context } = require("@actions/github");
const Action = require("./src/action");

async function run() {
  try {
    const token = core.getInput("TOKEN");

    const action = new Action(token, context);

    await action.run();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

const core = require("@actions/core");
const github = require("@actions/github");

class Action {
  constructor (token, context) {
    this.token = token;
    this.context = context;
    this.client = github.getOctokit(token);

    const { base, head } = this.getBaseAndHead(context)

    this.base = base;
    this.head = head;
  }

  getBaseAndHead(context) {
    const eventName = context.eventName

    let base;
    let head;

    switch (eventName) {
      case 'pull_request':
        base = context.payload.pull_request?.base?.sha
        head = context.payload.pull_request?.head?.sha
        break
      case 'push':
        base = context.payload.before
        head = context.payload.after
        break
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${context.eventName} events are not supported.`
        )
    }

    return { base, head }
  }

  async getFileChanges() {
    const response = await this.client.rest.repos.compareCommits({
      base: this.base,
      head: this.head,
      owner: this.context.repo.owner,
      repo: this.context.repo.repo
    })

    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${this.context.eventName} event returned ${response.status}, expected 200.`
      )
    }

    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${this.context.eventName} event is not ahead of the base commit.`
      )
    }

    return response.data.files;
  }

  getServicesWithChanges() {

  }

  async run () {
    const changes = await this.getFileChanges();

    core.info(JSON.stringify(changes));

    // const services = this.getServicesWithChanges(changes);


    // Run tests for those services

    // Comment the coverage report results in a single comment
    // (Update existing comment if it exists)

  }
}

module.exports = Action;

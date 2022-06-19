const core = require("@actions/core");
const github = require("@actions/github");
const exec = require('@actions/exec');

const SERVICES_WITH_TESTS = [
  "AccountingService",
  "AgreementService",
  "AnalyticsService",
  "AssetService",
  "AuthenticationService",
  "CRMService",
  "ClientActivityService",
  "ClientSalesService",
  "ClientService",
  "CommunicationService",
  "CredentialService",
  "DataMappingService",
  "GatewayService",
  "NotificationService",
  "ReportingService",
]

class Action {
  constructor (token, context) {
    this.token = token;
    this.context = context;
    this.client = github.getOctokit(token);
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
    const { base, head } = this.getBaseAndHead(this.context)

    const response = await this.client.rest.repos.compareCommits({
      base: base,
      head: head,
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

  getServicesWithChanges(changes) {
    const services = new Set();

    changes.forEach((change) => {
      const service = change.filename?.split('/')[0] || "";

      if (SERVICES_WITH_TESTS.includes(service)) {
        services.add(service);
      }
    })

    return Array.from(services);
  }

  async runTests(services) {
    await exec.exec("source $NVM_DIR/nvm.sh");

    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (SERVICES_WITH_TESTS.includes(service)) {
        core.info(`Installing npm packages for ${service}...`);
        await exec.exec(`npm --prefix ./${service} install`);

        core.info(`Running tests for ${service}...`);
        await exec.exec(`PORT=9000 DB_USERNAME_TEST=postgres DB_PASSWORD_TEST=postgres npm --prefix ./${service} run test:ci`);
      }
    }
  }

  async run () {
    const changes = await this.getFileChanges();

    const services = this.getServicesWithChanges(changes);

    if (services.length === 0) {
      core.info("No files have changed in service directories with tests.")
    } else {
      await this.runTests(services);

      // Comment the coverage report results in a single comment
      // (Update existing comment if it exists)
    }
  }
}

module.exports = Action;

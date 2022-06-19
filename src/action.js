const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

const { getCoverageSummary } = require("./coverage.helper");
const { generateTagLine, postComment } = require("./comment.helper");

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
];

class Action {
  constructor (options) {
    this.client = github.getOctokit(options.token);
    this.context = github.context;

    this.coverage = options.coverage;
    this.dbUser = options.dbUser;
    this.dbPassword = options.dbPassword;
    this.port = options.port;
    this.coverageThreshold = options.coverageThreshold;
  }

  getBaseAndHead () {
    const eventName = this.context.eventName;

    let base;
    let head;

    switch (eventName) {
      case "pull_request":
        base = this.context.payload.pull_request?.base?.sha;
        head = this.context.payload.pull_request?.head?.sha;
        break;
      case "push":
        base = this.context.payload.before;
        head = this.context.payload.after;
        break;
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${this.context.eventName} events are not supported.`,
        );
    }

    return { base, head };
  }

  async getFileChanges () {
    const { base, head } = this.getBaseAndHead();

    const response = await this.client.rest.repos.compareCommits({
      base: base,
      head: head,
      owner: this.context.repo.owner,
      repo: this.context.repo.repo,
    });

    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${this.context.eventName} event returned ${response.status}, expected 200.`,
      );
    }

    if (response.data.status !== "ahead") {
      core.setFailed(
        `The head commit for this ${this.context.eventName} event is not ahead of the base commit.`,
      );
    }

    return response.data.files;
  }

  getServicesWithChanges (changes) {
    const services = new Set();

    changes.forEach((change) => {
      const service = change.filename?.split("/")[0] || "";

      if (SERVICES_WITH_TESTS.includes(service)) {
        services.add(service);
      }
    });

    return Array.from(services);
  }

  async runTests (services) {
    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (SERVICES_WITH_TESTS.includes(service)) {
        core.startGroup(`${service}`);

        core.info(`Installing npm packages for ${service}...`);
        await exec.exec(`npm --prefix ./${service} install`);

        core.info(`Running tests for ${service}...`);
        await exec.exec("bash", [
          "-c",
          `PORT=${this.port} DB_USERNAME_TEST=${this.dbUser} DB_PASSWORD_TEST=${this.dbPassword} npm --prefix ./${service} run test:ci`,
        ]);

        core.endGroup();
      }
    }
  }

  generateCoverageReport (service) {
    const report = require(`${process.cwd()}/${service}/coverage-report.json`);
    let content = `## ${service}\n`;

    if (!report.success) {
      content += `🛑 Test suite has failed to run.\n\n`;

      return content;
    }

    content += `Test suite ran ${report.numFailedTests === 0 ? "successfully ✅" : "with errors 🛑"}.\n`;
    if (report.numFailedTests > 0) {
      content += `${report.numFailedTests} test${report.numFailedTests > 1 ? "s" : ""} failed.\n`;
    } else {
      content += `${report.numPassedTests} test${report.numFailedTests > 1 ? "s" : ""} passed in ${report.numPassedTestSuites} suites.\n`;
    }

    const coverage = getCoverageSummary(report);

    content += "| Status | Category | Coverage % | Covered/Total |\n";
    content += "|:------:|:-------|:-------|:-------|\n";

    coverage.forEach((cvg) => {
      content += `| ${cvg.percentage > this.coverageThreshold ? ":green_circle:" : ":red_circle:"} | ${cvg.category} | ${cvg.percentage.toFixed(2)}% | ${cvg.covered}/${cvg.total} |\n`;
    });

    return content;
  }

  generateReportComment (services) {
    core.info(`Generating coverage report...`);

    let comment = generateTagLine();
    comment += "# Coverage Report\n\n";

    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      comment += this.generateCoverageReport(service);

      if (i !== services.length - 1) {
        comment += "---\n";
      }
    }

    return comment;
  }

  async run () {
    const changes = await this.getFileChanges();

    const services = this.getServicesWithChanges(changes);

    if (services.length === 0) {
      core.notice("No files have changed in service directories with tests.");
    } else {
      core.info(`Found services with changes: ${services.join(", ")}...`);
      await this.runTests(services);

      if (this.coverage || this.coverage === "true") {
        const comment = this.generateReportComment(services);

        await postComment(comment);
      }
    }
  }
}

module.exports = Action;

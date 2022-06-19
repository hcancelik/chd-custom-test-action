const Action = require("../src/action");
const helper = require("./test.helper");

const action = new Action({
  token: "token",
  dbUser: "dbUser",
  dbPassword: "dbPassword",
  port: "9000",
});

test("getServicesWithChanges returns correct services", async () => {
  const changes = action.getServicesWithChanges(helper.exampleFilesChanges);

  await expect(changes.length).toBe(2);
  await expect(changes).toEqual(["ClientService", "ReportingService"]);
});

test("coverage report results", async () => {
  const response = await action.generateCoverageReport("tests");

  expect(response).toBe(helper.exampleCoverageComment());
});

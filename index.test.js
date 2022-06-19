const Action = require("./src/action.js");

const exampleFilesChanges = [
  {
    sha: "1",
    filename: "./github/workflow/foo.yml",
    status: "removed",
    additions: 0,
    deletions: 42,
    changes: 42,
  },
  {
    sha: "2",
    filename: "README.md",
    status: "added",
    additions: 12,
    deletions: 0,
    changes: 12,
  },
  {
    sha: "3",
    filename: "ClientService/foo/bar/baz.js",
    status: "modified",
    additions: 1,
    deletions: 1,
    changes: 2,
  },
  {
    sha: "4",
    filename: "ReportingService/foo/bar/baz.js",
    status: "modified",
    additions: 1,
    deletions: 1,
    changes: 2,
  },
  {
    sha: "4",
    filename: "FooService/foo/bar/baz.js",
    status: "modified",
    additions: 1,
    deletions: 1,
    changes: 2,
  },
];

const action = new Action("12345", {});

test("getServicesWithChanges returns correct services", async () => {
  const changes = action.getServicesWithChanges(exampleFilesChanges);

  await expect(changes.length).toBe(2);
  await expect(changes).toEqual(["ClientService", "ReportingService"]);
});

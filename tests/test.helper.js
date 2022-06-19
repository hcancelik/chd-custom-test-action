module.exports = {
  exampleFilesChanges: [
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
  ],
  exampleCoverageComment: () => {
    let result = "## tests\nTest suite ran successfully ✅.\n300 test passed in 10 suites.\n";
    result += "| Status | Category | Coverage % | Covered/Total |\n";
    result += "|:------:|:-------|:-------|:-------|\n";
    result += "| :red_circle: | Statements | 29.46% | 733/2488 |\n";
    result += "| :red_circle: | Branches | 11.65% | 97/397 |\n";
    result += "| :red_circle: | Functions | 24.43% | 97/397 |\n";
    result += "| :red_circle: | Lines | 30.05% | 732/2436 |\n";

    return result;
  }
};

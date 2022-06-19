const fs = require('fs').promises;

function counter (data, key) {
  return Object.values(data[key]).length;
}

function coveredCounter (data, key) {
  return Object.values(data[key]).filter((hits) => hits > 0).length;
}

function branchCounter (data) {
  return Object.values(data.b).reduce((acc, branch) => acc + branch.length, 0);
}

function coveredBranchCounter (data) {
  return Object.values(data.b).reduce(
    (acc, branch) => acc + branch.filter((hits) => hits > 0).length,
    0,
  );
}

function getLineCoverage (data) {
  const statementMap = data.statementMap;
  const statements = data.s;

  return Object.entries(statements).reduce((acc, [st, count]) => {
    const index = parseInt(st);

    if (!statementMap[index]) {
      return acc;
    }
    const { line } = statementMap[index].start;
    const prevVal = acc[line];
    if (prevVal === undefined || prevVal < count) {
      acc[line] = count;
    }
    return acc;
  }, {});
}

function totalLinesCounter (value) {
  const lines = getLineCoverage(value);

  return Object.keys(lines).length;
}

function totalCoveredLinesCounter (value) {
  const lines = getLineCoverage(value);

  return Object.values(lines).filter((v) => !!v).length;
}

function getPercentage (covered, total) {
  if (total === 0) return 100;

  return (covered / total) * 100;
}

function getFileCoverageMap (report) {
  return Object.entries(report.coverageMap).reduce(
    (acc, [filename, fileCoverage]) => {
      acc[filename] = {
        totalStatements: counter(fileCoverage, "s"),
        coveredStatements: coveredCounter(fileCoverage, "s"),
        totalFunctions: counter(fileCoverage, "f"),
        coveredFunctions: coveredCounter(fileCoverage, "f"),
        totalBranches: branchCounter(fileCoverage),
        coveredBranches: coveredBranchCounter(fileCoverage),
        totalLines: totalLinesCounter(fileCoverage),
        coveredLines: totalCoveredLinesCounter(fileCoverage),
      };
      return acc;
    },
    {},
  );
}

function getCoverageDetails (report) {
  const map = getFileCoverageMap(report);

  return Object.values(map).reduce(
    (acc, current) => {
      acc.totalStatements += current.totalStatements;
      acc.coveredStatements += current.coveredStatements;
      acc.totalFunctions += current.totalFunctions;
      acc.coveredFunctions += current.coveredFunctions;
      acc.totalBranches += current.totalBranches;
      acc.coveredBranches += current.coveredBranches;
      acc.totalLines += current.totalLines;
      acc.coveredLines += current.coveredLines;

      return acc;
    },
    {
      totalStatements: 0,
      coveredStatements: 0,
      totalFunctions: 0,
      coveredFunctions: 0,
      totalBranches: 0,
      coveredBranches: 0,
      totalLines: 0,
      coveredLines: 0,
    },
  );
}

module.exports = {
  readCoverageFile: async (path) => {
    const contents = await fs.readFile(path, 'utf8');

    return JSON.parse(contents);
  },
  getCoverageSummary: (report) => {
    const details = getCoverageDetails(report);

    return [
      {
        category: "Statements",
        percentage: getPercentage(details.coveredStatements, details.totalStatements),
        covered: details.coveredStatements,
        total: details.totalStatements,
      },
      {
        category: "Branches",
        percentage: getPercentage(details.coveredBranches, details.totalBranches),
        covered: details.coveredFunctions,
        total: details.totalFunctions,
      },
      {
        category: "Functions",
        percentage: getPercentage(details.coveredFunctions, details.totalFunctions),
        covered: details.coveredFunctions,
        total: details.totalFunctions,
      },
      {
        category: "Lines",
        percentage: getPercentage(details.coveredLines, details.totalLines),
        covered: details.coveredLines,
        total: details.totalLines,
      },
    ];
  },
};

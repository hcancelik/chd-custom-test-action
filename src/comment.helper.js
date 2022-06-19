const core = require("@actions/core");
const { context, getOctokit } = require("@actions/github");
const github = require("@actions/github");

const prNumber = github.context.payload.pull_request?.number;

async function checkComment () {
  const octokit = getOctokit(context.github.token);
  const { owner, repo } = context.repo;
  const commentList = await octokit.paginate(
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
    {
      owner,
      repo,
      issue_number: prNumber,
    }
  );

  const previousReport = commentList.find((comment) =>
    comment.body?.startsWith(module.exports.generateTagLine())
  );

  return previousReport || null;
}

async function addComment (comment) {
  const octokit = getOctokit(context.github.token);
  const { owner, repo } = context.repo;
  const { data } = await octokit.repos.createCommitComment({
    owner,
    repo,
    issue_number: prNumber,
    body: comment,
  });

  return data;
}

async function updateComment (existingComment, comment) {
  const octokit = getOctokit(context.github.token);
  const { owner, repo } = context.repo;
  const { data } = await octokit.issues.updateComment({
    owner,
    repo,
    comment_id: existingComment.id,
    body: comment,
  });

  return data;
}

module.exports = {
  generateTagLine () {
    return `<!-- Coverage Report: ${prNumber} -->`;
  },
  async postComment (comment) {
    const existingComment = await checkComment();

    if (existingComment) {
      core.info("Comment already exists. Updating the comment...");

      await updateComment(existingComment, comment);
    } else {
      core.info("Creating a new comment...");

      await addComment(comment);
    }
  },
};

//import { OctokitResponse, PullsListReviewsResponseData } from "@octokit/types";
import * as core from "@actions/core";
import * as github from "@actions/github";

const repoTokenInput = core.getInput("repo-token", { required: true });
const githubClient = github.getOctokit(repoTokenInput);

const bodyRegexInput: string = core.getInput("body-regex");

async function run(): Promise<void> {
  const githubContext = github.context;
  const pullRequest = githubContext.issue;

  const bodyRegex = new RegExp(bodyRegexInput,"im");
  const body: string =
    (githubContext.payload.pull_request?.body as string) ?? "";
  

  core.debug(`Body Regex: ${bodyRegex.source}`);
  core.debug(`Body: ${body}`);
  core.debug(`Matches: ${bodyRegex.test(body)}`);
  listFiles({...pullRequest,pull_number:pullRequest.number});
}
function listFiles(pullRequest: {owner: string, repo: string, pull_number: number}) {
  void githubClient.pulls.listFiles(pullRequest).then(data => core.debug(JSON.stringify(data)));
}
run().catch((error) => {
  core.setFailed(error);
});

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
  const files = await listFiles({...pullRequest,pull_number:pullRequest.number});
  if(files.length > 0){
    core.debug(files.map(f => f.filename).join("\n"));
  }
}
async function listFiles(pullRequest: {owner: string, repo: string, pull_number: number}) {
  const {data: files} = await githubClient.pulls.listFiles(pullRequest);
  return files;
}
run().catch((error) => {
  core.setFailed(error);
});

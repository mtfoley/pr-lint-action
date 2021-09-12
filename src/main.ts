//import { OctokitResponse, PullsListReviewsResponseData } from "@octokit/types";
import lint from '@commitlint/lint';
import * as core from "@actions/core";
import * as github from "@actions/github";

const repoTokenInput = core.getInput("repo-token", { required: true });
const githubClient = github.getOctokit(repoTokenInput);
const bodyRegexInput: string = core.getInput("body-regex");
const filesToWatch: string[] = core.getInput("filenames").split(/\s/).filter(f => f.trim() !== "");
async function run(): Promise<void> {
  const githubContext = github.context;
  const pullRequest = githubContext.issue;

  const bodyRegex = new RegExp(bodyRegexInput,"im");
  const body: string =
    (githubContext.payload.pull_request?.body as string) ?? "";
  const title: string =
    (githubContext.payload.pull_request?.title as string) ?? "";
  const links = 
    (githubContext.payload.pull_request?._links as object) ?? {};
  let report = {};
  lint(title).then(_report => report = _report);
  core.debug(`Title: ${title}`);
  core.debug(`Body Regex: ${bodyRegex.source}`);
  core.debug(`Body: ${body}`);
  core.debug(`Matches: ${bodyRegex.test(body)}`);
  core.debug(`Lint Valid: ${JSON.stringify(report)}`);
  core.debug(`Issue URL: ${JSON.stringify(links)}`);
  const files = await listFiles({...pullRequest,pull_number:pullRequest.number});
  const filesTripped = files.filter(f => filesToWatch.includes(f.filename));
  if(filesTripped.length > 0) {
    core.debug(`Files Tripped: ${filesTripped.map(f => f.filename).join(", ")}`);
  }
}
async function listFiles(pullRequest: {owner: string, repo: string, pull_number: number}) {
  const {data: files} = await githubClient.pulls.listFiles(pullRequest);
  return files;
}
run().catch((error) => {
  core.setFailed(error);
});

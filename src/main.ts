//import { OctokitResponse, PullsListReviewsResponseData } from "@octokit/types";
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as conventionalOpts from '@commitlint/config-conventional';
const repoTokenInput = core.getInput("repo-token", { required: true });
const githubClient = github.getOctokit(repoTokenInput);
const bodyRegexInput: string = core.getInput("body-regex");
const filesToWatch: string[] = core.getInput("filenames").split(/\s/).filter(f => f.trim() !== "");
const messageTitleValid: string = core.getInput("message-title-valid");
const messageTitleInvalid: string = core.getInput("message-title-invalid");
const messageIssueValid: string = core.getInput("message-issue-valid");
const messageIssueInvalid: string = core.getInput("message-issue-invalid");
const messageFilesMatched: string = core.getInput("message-files-matched");
const messageFilesNotMatched: string = core.getInput("message-files-not-matched");

async function run(): Promise<void> {
  const githubContext = github.context;
  const pullRequest = githubContext.issue;
  const bodyRegex = new RegExp(bodyRegexInput,"im");
  const body: string =
    (githubContext.payload.pull_request?.body as string) ?? "";
  const title: string =
    (githubContext.payload.pull_request?.title as string) ?? "";
  const {valid:titleValid,errors:lintErrors} = await checkTitle(title); 
  const files = await listFiles({...pullRequest,pull_number:pullRequest.number});
  const filesTripped = files.filter(f => filesToWatch.includes(f.filename)).length > 0;
  makeComment(githubContext,pullRequest.number,titleValid,lintErrors,bodyRegex.test(body),filesTripped);
}
async function checkTitle(title:string){
  const lintOpts = await load({extends: [conventionalOpts]});
  return await lint(title,lintOpts.rules);
}
async function listFiles(pullRequest: {owner: string, repo: string, pull_number: number}) {
  const {data: files} = await githubClient.pulls.listFiles(pullRequest);
  return files;
}
async function makeComment(context: any, number:number, titleValid: boolean, lintErrors: any[], linkedIssue: boolean, filesMatched: boolean) {
  let message = "### Pull Request Linter\n";
  const lintErrorsMessage: string = lintErrors.map(e=>e.message).join("\n");
  message += (titleValid ? messageTitleValid : messageTitleInvalid) + "\n";
  message += (linkedIssue ? messageIssueValid : (messageIssueInvalid + "Lint Errors:" + lintErrorsMessage)) + "\n";
  message += (filesMatched ? messageFilesMatched : messageFilesNotMatched) + "\n";
  // short circuit if nothing to say.
  if(message.trim() == "") return;
  await githubClient.issues.createComment({
    ...context.repo,
    issue_number: number,
    body: message
  });
}
run().catch((error) => {
  core.setFailed(error);
});

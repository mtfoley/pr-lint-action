import * as core from "@actions/core";
import * as github from "@actions/github";


const bodyRegexInput: string = core.getInput("body-regex");

async function run(): Promise<void> {
  const githubContext = github.context;

  const bodyRegex = new RegExp(bodyRegexInput);
  const body: string =
    (githubContext.payload.pull_request?.description as string) ?? "";
  
  core.debug(`Body Regex: ${bodyRegex.source}`);
  core.debug(`Body: ${body}`);
  core.debug(`Matches: ${bodyRegex.test(body)}`);

}

run().catch((error) => {
  core.setFailed(error);
});

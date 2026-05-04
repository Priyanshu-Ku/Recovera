import { prisma } from "../lib/prisma";
import { Octokit } from "@octokit/rest";

async function revertPR() {
  console.log("=== REVERTING PR ===");

  const repoFullName = "Priyanshu8023/portfolio";
  const prNumber = 1;

  // 1. Find the repo
  const repo = await prisma.repository.findFirst({
    where: { fullName: repoFullName }
  });

  if (!repo) {
    console.error("Repo not found.");
    return;
  }

  // 2. Find the token
  const account = await prisma.account.findFirst({
    where: { userId: repo.userId, provider: "github" }
  });

  if (!account || !account.access_token) {
    console.error("Token not found.");
    return;
  }

  const octokit = new Octokit({ auth: account.access_token });
  const [owner, name] = repoFullName.split("/");

  try {
    // 3. Get PR details to find branch
    console.log(`Fetching PR #${prNumber}...`);
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo: name,
      pull_number: prNumber
    });

    const branchName = pr.head.ref;

    // 4. Close the PR
    console.log(`Closing PR #${prNumber}...`);
    await octokit.pulls.update({
      owner,
      repo: name,
      pull_number: prNumber,
      state: "closed"
    });

    // 5. Delete the branch
    console.log(`Deleting branch ${branchName}...`);
    await octokit.git.deleteRef({
      owner,
      repo: name,
      ref: `heads/${branchName}`
    });

    console.log("SUCCESS: PR closed and branch deleted.");

    // 6. Update DB to reflect closure
    await prisma.incidentAction.updateMany({
      where: { prUrl: pr.html_url },
      data: { status: "closed" }
    });

  } catch (err: any) {
    console.error(`FAILED to revert PR: ${err.message}`);
  }
}

revertPR().catch(console.error);

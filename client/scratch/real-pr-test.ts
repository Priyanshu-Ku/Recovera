import { prisma } from "../lib/prisma";
import { createPullRequest } from "../lib/github/prCreator";

async function simulateRealPR() {
  console.log("=== STARTING REAL PR SIMULATION ===");

  // 1. Find the portfolio repo
  const repo = await prisma.repository.findFirst({
    where: { name: "portfolio" }
  });

  if (!repo) {
    console.error("Portfolio repository not found in database.");
    return;
  }

  // 2. Find the GitHub token
  const account = await prisma.account.findFirst({
    where: { userId: repo.userId, provider: "github" }
  });

  if (!account || !account.access_token) {
    console.error("No GitHub access token found for user.");
    return;
  }

  console.log(`Found token for user ${repo.userId}. Attempting real PR for ${repo.fullName}...`);

  // 3. Create/Update Incident for UI
  const incident = await prisma.incident.create({
    data: {
      repositoryId: repo.id,
      fingerprint: `fprint-abort-real-${Date.now()}`,
      title: "ReferenceError: AbortController is not defined",
      severity: "critical",
      status: "PROCESSING",
      confidence: 0.99
    }
  });

  // 4. Create RCA for UI
  await prisma.incidentRca.create({
    data: {
      incidentId: incident.id,
      rcaPayload: JSON.stringify({
        rootCauseSummary: "Real-time analysis: AbortController is missing in the production environment. This is causing API request failures in the portfolio application.",
        confidence: 0.99,
        suggestedFix: "Injecting polyfill to ensure compatibility with older Node.js runtimes.",
        strategy: "POLYFILL_INJECT"
      }),
      version: 1
    }
  });

  // 5. Attempt REAL PR (Direct File Write)
  console.log("Step: Attempting direct file edit and PR creation...");
  
  const prResult = await (async () => {
    const branchName = `auto-fix/inc-${incident.id}-${Date.now()}`;
    const [owner, repoNameStr] = repo.fullName.split('/');
    const workDir = await (require('fs/promises')).mkdtemp((require('path')).join((require('os')).tmpdir(), 'recovera-pr-'));
    
    try {
      const cloneUrl = `https://x-access-token:${account.access_token}@github.com/${repo.fullName}.git`;
      await (require('util').promisify(require('child_process').exec))(`git clone --depth 1 ${cloneUrl} .`, { cwd: workDir });
      await (require('util').promisify(require('child_process').exec))(`git checkout -b ${branchName}`, { cwd: workDir });
      
      const filePath = (require('path')).join(workDir, 'src/utils/api.ts');
      const dirPath = (require('path')).dirname(filePath);
      
      await (require('fs/promises')).mkdir(dirPath, { recursive: true });
      
      let content = "";
      try {
        content = await (require('fs/promises')).readFile(filePath, 'utf-8');
      } catch (e) {
        content = "// Created by AutoSRE\n";
      }

      const newContent = `// Auto-SRE Polyfill for AbortController
if (typeof AbortController === 'undefined') {
  try {
    const { AbortController: Polyfill } = require('abort-controller');
    global.AbortController = Polyfill;
  } catch (e) {
    console.warn('AbortController polyfill failed to load');
  }
}

${content}`;

      await (require('fs/promises')).writeFile(filePath, newContent);
      
      await (require('util').promisify(require('child_process').exec))(`git config user.name "Recovera AutoSRE"`, { cwd: workDir });
      await (require('util').promisify(require('child_process').exec))(`git config user.email "bot@recovera.io"`, { cwd: workDir });
      await (require('util').promisify(require('child_process').exec))(`git add .`, { cwd: workDir });
      await (require('util').promisify(require('child_process').exec))(`git commit -m "fix: resolve AbortController ReferenceError"`, { cwd: workDir });
      await (require('util').promisify(require('child_process').exec))(`git push origin ${branchName}`, { cwd: workDir });
      
      const { Octokit } = require('@octokit/rest');
      const octokit = new Octokit({ auth: account.access_token });
      const { data: pr } = await octokit.pulls.create({
        owner,
        repo: repoNameStr,
        title: `fix(autosre): resolve AbortController ReferenceError`,
        body: `## AutoSRE Remediation\n\nDetected a \`ReferenceError: AbortController is not defined\`.\n\n### Fix\nInjected a polyfill check in \`src/utils/api.ts\`.`,
        head: branchName,
        base: repo.defaultBranch || "main"
      });

      return { success: true, prUrl: pr.html_url, branchName, commitSha: "manual-sha" };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    } finally {
      await (require('fs/promises')).rm(workDir, { recursive: true, force: true });
    }
  })();

  if (prResult.success) {
    console.log(`SUCCESS! Real PR created: ${prResult.prUrl}`);
    
    // Update DB with real PR info
    await prisma.incidentAction.create({
      data: {
        incidentId: incident.id,
        actionType: "open_pr",
        status: "opened",
        prUrl: prResult.prUrl,
        branchName: prResult.branchName,
        commitSha: prResult.commitSha
      }
    });

    await prisma.incident.update({
      where: { id: incident.id },
      data: { status: "ANALYZED" }
    });
  } else {
    console.error(`FAILED to create real PR: ${prResult.error}`);
    
    // Still create a mock entry so the user sees something in the UI, but mark as failed
    await prisma.incidentAction.create({
      data: {
        incidentId: incident.id,
        actionType: "open_pr",
        status: "failed",
        failureReason: prResult.error
      }
    });
  }

  console.log("=== SIMULATION COMPLETE ===");
}

simulateRealPR().catch(console.error);

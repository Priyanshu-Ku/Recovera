import { prisma } from "../lib/prisma";
import { createPullRequest } from "../lib/github/prCreator";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function ultimateSimulation() {
  console.log("🚀 STARTING ULTIMATE AI AGENT SIMULATION");
  console.log("This script will run for ~3 minutes to simulate a realistic AI SRE workflow.");

  // 1. Setup
  const repo = await prisma.repository.findFirst({ where: { name: "portfolio" } });
  if (!repo) {
    console.error("❌ Portfolio repository not found in database.");
    return;
  }
  const account = await prisma.account.findFirst({ where: { userId: repo.userId, provider: "github" } });
  if (!account?.access_token) {
    console.error("❌ GitHub token missing.");
    return;
  }

  // Cleanup old simulation data for 'portfolio'
  await prisma.incident.deleteMany({ where: { repositoryId: repo.id, title: { contains: "AbortController" } } });

  // T=0s: Inject Healthy Signal
  console.log("[T+0s] Injecting healthy system logs...");
  await prisma.detectionQueue.create({
    data: {
      eventId: `sim-h-${Date.now()}`,
      payload: {
        timestamp: new Date().toISOString(),
        messageRaw: "INFO: System metrics within normal parameters. CPU: 12%, Memory: 45%.",
        repoFullName: repo.fullName,
        resourceType: "lambda",
        severity: "info"
      } as any,
      status: "completed",
      processedAt: new Date()
    }
  });

  console.log("⏱️ Waiting 15 seconds for the next event...");
  await sleep(15000);

  // T=15s: Inject Error
  console.log("[T+15s] 🚨 Injecting critical AbortController error...");
  const incident = await prisma.incident.create({
    data: {
      repositoryId: repo.id,
      fingerprint: `fprint-abort-${Date.now()}`,
      title: "ReferenceError: AbortController is not defined",
      severity: "critical",
      status: "DETECTED",
      confidence: 0.95,
      firstSeenAt: new Date(),
      lastSeenAt: new Date()
    }
  });
  console.log(`Incident ${incident.id} created.`);

  console.log("⏱️ AI is 'Thinking'... Waiting 90 seconds to simulate deep analysis.");
  await sleep(90000); // 1.5 minutes total wait now

  // T=105s: Detailed RCA
  console.log("[T+105s] 🧠 AI finished analysis. Generating detailed RCA...");
  const detailedRca = {
    rootCauseSummary: "Detailed Analysis: The 'portfolio' application is attempting to use the 'AbortController' global to manage API request timeouts in 'src/utils/api.ts'. However, the current production environment (Node.js < v15.0.0) does not support AbortController natively. This results in a ReferenceError, causing all outgoing API calls to fail and the UI to hang.",
    confidence: 0.98,
    suggestedFix: "Implement a universal polyfill for AbortController at the entry point of the API utility layer to ensure cross-version compatibility without refactoring the business logic.",
    strategy: "AUTO_REMEDIATION_PATCH",
    impactScope: ["API Layer", "Network Requests", "User Experience"]
  };

  await prisma.incidentRca.create({
    data: {
      incidentId: incident.id,
      rcaPayload: JSON.stringify(detailedRca),
      version: 1
    }
  });
  
  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "ANALYZED" }
  });

  console.log("⏱️ AI is now 'Analyzing Repo' and 'Generating Fix'... Waiting 30 seconds.");
  await sleep(30000);

  // T=135s: Action Processing
  console.log("[T+135s] 🛠️ AI is pushing the fix to GitHub...");
  const action = await prisma.incidentAction.create({
    data: {
      incidentId: incident.id,
      actionType: "open_pr",
      status: "running",
      label: "Cloning Repository & Applying Polyfill"
    } as any
  });

  // T=150s: Real PR Creation
  const patchDiff = `// Auto-SRE Polyfill
if (typeof AbortController === 'undefined') {
  const { AbortController: Polyfill } = require('abort-controller');
  global.AbortController = Polyfill;
}
`;
  
  const prResult = await createPullRequest({
    repoFullName: repo.fullName,
    incidentId: incident.id,
    patchDiff: `diff --git a/src/utils/api.ts b/src/utils/api.ts\nindex e69de29..8675309 100644\n--- a/src/utils/api.ts\n+++ b/src/utils/api.ts\n@@ -0,0 +1,5 @@\n+if (typeof AbortController === 'undefined') {\n+  const { AbortController: Polyfill } = require('abort-controller');\n+  global.AbortController = Polyfill;\n+}\n`,
    githubToken: account.access_token,
    prTitle: `fix(autosre): inject AbortController polyfill`,
    prBody: `## AutoSRE Remediation Report\n\n**Incident**: ${incident.title}\n**Root Cause**: Missing AbortController global in target runtime.\n**Solution**: Injected a conditional polyfill in \`src/utils/api.ts\` to restore system stability.`,
    baseBranch: repo.defaultBranch || "main"
  });

  if (prResult.success) {
    console.log(`✅ SUCCESS! Real PR created: ${prResult.prUrl}`);
    await prisma.incidentAction.update({
      where: { id: action.id },
      data: {
        status: "opened",
        prUrl: prResult.prUrl,
        branchName: prResult.branchName,
        commitSha: prResult.commitSha
      }
    });
    await prisma.incident.update({
      where: { id: incident.id },
      data: { status: "RESOLVED" }
    });
  } else {
    console.error(`❌ PR Failed: ${prResult.error}`);
    await prisma.incidentAction.update({
      where: { id: action.id },
      data: { status: "failed", failureReason: prResult.error }
    });
  }

  console.log("✨ ULTIMATE SIMULATION COMPLETE. Refresh your dashboard to see the full timeline!");
}

ultimateSimulation().catch(console.error);

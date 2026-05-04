import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { repoFullName } = await req.json();

    const repo = await prisma.repository.findFirst({
      where: { fullName: repoFullName }
    });

    if (!repo) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

    // 1. Cleanup
    await prisma.incident.deleteMany({ where: { repositoryId: repo.id } });
    await prisma.safetyAuditLog.deleteMany({ where: { incidentId: { in: ["system", "sim-id"] } } });

    // 2. Start Simulation Sequence (Async)
    runSimulation(repo.id, repoFullName);

    return NextResponse.json({ success: true, message: "Simulation started" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function runSimulation(repoId: string, repoFullName: string) {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // T=0: Initializing
  await prisma.safetyAuditLog.create({
    data: {
      incidentId: "system",
      actionType: "initialization",
      decision: "INITIALIZING",
      reasonCodes: "SYSTEM_BOOT",
      riskScore: 0,
      details: "Recovera AI is establishing a secure tunnel to your production log stream..."
    }
  });

  await sleep(15000);

  // T=15s: Monitoring
  await prisma.safetyAuditLog.create({
    data: {
      incidentId: "system",
      actionType: "monitoring",
      decision: "MONITORING",
      reasonCodes: "TRAFFIC_SCAN",
      riskScore: 0,
      details: "Real-time monitoring active. Analyzing traffic patterns for anomalies."
    }
  });

  await sleep(60000); // Wait 1 minute for detection

  // T=75s: Detected
  const incident = await prisma.incident.create({
    data: {
      repositoryId: repoId,
      fingerprint: `sim-abort-${Date.now()}`,
      title: "ReferenceError: AbortController is not defined",
      severity: "critical",
      status: "DETECTED",
      confidence: 0.98,
      firstSeenAt: new Date(),
      lastSeenAt: new Date()
    }
  });

  await prisma.safetyAuditLog.create({
    data: {
      incidentId: incident.id,
      actionType: "detection",
      decision: "DETECTED",
      reasonCodes: "RUNTIME_ERROR",
      riskScore: 0.8,
      details: "Critical exception detected in 'src/utils/api.ts'. Multiple failures reported."
    }
  });

  await sleep(15000);

  // T=90s: Analyzing
  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "PROCESSING" }
  });

  const rca = {
    rootCauseSummary: "Detailed Analysis: The 'portfolio' app is using 'AbortController' natively, which is not supported in the production Node.js v14 environment. This leads to a ReferenceError during API request timeouts.",
    confidence: 0.99,
    suggestedFix: "Inject a conditional polyfill in the main entry point to handle cross-version AbortController support."
  };

  await prisma.incidentRca.create({
    data: {
      incidentId: incident.id,
      rcaPayload: JSON.stringify(rca),
      version: 1
    }
  });

  await prisma.safetyAuditLog.create({
    data: {
      incidentId: incident.id,
      actionType: "analysis",
      decision: "ANALYZING",
      reasonCodes: "ROOT_CAUSE_IDENTIFIED",
      riskScore: 0.05,
      details: "Root cause found: Environment incompatibility (Node.js < 15)."
    }
  });

  await sleep(15000);

  // T=105s: Solving
  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "ANALYZED" }
  });

  await prisma.safetyAuditLog.create({
    data: {
      incidentId: incident.id,
      actionType: "remediation",
      decision: "SOLVING",
      reasonCodes: "PATCH_READY",
      riskScore: 0.02,
      details: "Generating a high-confidence polyfill solution. Validating against codebase structure."
    }
  });

  await sleep(15000);

  // T=120s: PR/Fixed
  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "EXECUTED" }
  });

  await prisma.patchArtifact.create({
    data: {
      incidentId: incident.id,
      patchDiff: "diff --git a/src/utils/api.ts b/src/utils/api.ts\n+if (typeof AbortController === 'undefined') { global.AbortController = require('abort-controller'); }",
      changeSummary: "Injected AbortController polyfill for Node.js 14 compatibility.",
      riskScore: 0.01,
      validationStatus: "passed",
      validationLogs: "Unit tests passed. Polyfill verified in sandbox environment."
    }
  });

  await prisma.incidentAction.create({
    data: {
      incidentId: incident.id,
      actionType: "open_pr",
      status: "pending_approval",
      requiresApproval: true,
      label: "Fix: Inject AbortController Polyfill",
      prUrl: "https://github.com/Priyanshu8023/portfolio/pull/mock"
    } as any
  });

  await prisma.safetyAuditLog.create({
    data: {
      incidentId: incident.id,
      actionType: "pr_creation",
      decision: "REQUIRE_HUMAN_APPROVAL",
      reasonCodes: "FINAL_GATE",
      riskScore: 0.01,
      details: "Detailed solution for AbortController is ready. Waiting for user approval to merge fix."
    }
  });
}

import { prisma } from "../lib/prisma";

async function check() {
  try {
    const repos = await prisma.repository.findMany({ where: { name: 'portfolio' } });
    repos.forEach(r => console.log(`- Repo ${r.fullName} (ID: ${r.id}) belongs to User ${r.userId}`));
    const accounts = await prisma.account.findMany({ where: { provider: 'github' } });
    accounts.forEach(a => console.log(`- Account for User ${a.userId} HAS_TOKEN: ${!!a.access_token}`));
    const totalRcas = await prisma.incidentRca.count();
    const recentRcas = await prisma.incidentRca.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    const totalAudits = await prisma.safetyAuditLog.count();
    const openIncidents = await prisma.incident.findMany({ 
      where: { NOT: { status: 'CLOSED' } },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log("=== AI DATABASE STATS ===");
    console.log(`Total RCA entries: ${totalRcas}`);
    console.log(`Total Safety Audits: ${totalAudits}`);
    
    console.log("\n--- Recent RCAs ---");
    recentRcas.forEach(rca => {
      console.log(`- ${rca.createdAt.toISOString()}: ${rca.rcaPayload.substring(0, 50)}...`);
    });
    const recentActions = await prisma.incidentAction.findMany({ 
      take: 5, 
      orderBy: { createdAt: 'desc' } 
    });
    
    console.log("=== AI STATUS REPORT ===");
    console.log(`Pending in Detection Queue: ${pendingQueue}`);
    console.log(`Pending Incident Events: ${processingEvents}`);
    console.log(`\nActive Incidents: ${openIncidents.length}`);
    openIncidents.forEach(inc => {
      console.log(`- [${inc.status}] ${inc.title} (ID: ${inc.id})`);
    });
    
    console.log("\n--- Recent AI Thoughts (Safety Audits) ---");
    recentAudits.forEach(audit => {
      console.log(`- ${audit.createdAt.toISOString()}: ${audit.actionType} -> ${audit.decision} (${audit.reasonCodes})`);
    });
    
    console.log("\n--- Recent AI Actions ---");
    recentActions.forEach(action => {
      console.log(`- ${action.createdAt.toISOString()}: ${action.actionType} -> ${action.status}`);
    });
  } catch (err) {
    console.error("Failed to check AI status:", err);
  } finally {
    await prisma.$disconnect();
  }
}

check();

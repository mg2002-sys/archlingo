// ============================================================================
// ARCHLINGO CURRICULUM - UNIFIED 100 STAGES (PHASES 1 - 10)
// Complete mastery of Distributed Systems & Backend Engineering.
// ============================================================================

window.SECTIONS_META = [
  {
    id: 1,
    title: "Phase 1: Internet, Networking & Web Protocol Foundations",
    stages: [1, 10],
    color: "#58cc02",
    badge: "🌐 Networking Foundations (1–10)"
  },
  {
    id: 2,
    title: "Phase 2: Web Architecture, Scaling & Traffic Distribution",
    stages: [11, 20],
    color: "#10b981",
    badge: "⚖️ Scaling & Load Balancing (11–20)"
  },
  {
    id: 3,
    title: "Phase 3: Hardware Invariants & Storage Engines from Scratch",
    stages: [21, 30],
    color: "#0ea5e9",
    badge: "💾 Storage Engines & LSM (21–30)"
  },
  {
    id: 4,
    title: "Phase 4: Relational Databases, Transactions & Replication",
    stages: [31, 40],
    color: "#6366f1",
    badge: "🗄️ Relational & ACID (31–40)"
  },
  {
    id: 5,
    title: "Phase 5: High-Performance In-Memory Caching",
    stages: [41, 50],
    color: "#ec4899",
    badge: "⚡ In-Memory & Redis (41–50)"
  },
  {
    id: 6,
    title: "Phase 6: Partitioning, Sharding & Consistent Hashing",
    stages: [51, 60],
    color: "#8b5cf6",
    badge: "🍩 Sharding & Hash Rings (51–60)"
  },
  {
    id: 7,
    title: "Phase 7: Distributed Systems Theory, Consensus & Quorums",
    stages: [61, 70],
    color: "#f59e0b",
    badge: "🗳️ Quorums & Raft (61–70)"
  },
  {
    id: 8,
    title: "Phase 8: Asynchronous Architecture, Event Streams & Message Brokers",
    stages: [71, 80],
    color: "#ff9600",
    badge: "📨 Kafka & Event Streams (71–80)"
  },
  {
    id: 9,
    title: "Phase 9: Microservices, APIs, Resilience & Security",
    stages: [81, 90],
    color: "#14b8a6",
    badge: "🛡️ Resilience & Security (81–90)"
  },
  {
    id: 10,
    title: "Phase 10: Senior Principal Real-World System Design Blueprints",
    stages: [91, 100],
    color: "#f43f5e",
    badge: "🏛️ Capstone Architectures (91–100)"
  }
];

window.CURRICULUM_100 = [
  ...(window.PHASE1_STAGES || []),
  ...(window.PHASE2_STAGES || []),
  ...(window.PHASE3_STAGES || []),
  ...(window.PHASE4_STAGES || []),
  ...(window.PHASE5_STAGES || []),
  ...(window.PHASE6_STAGES || []),
  ...(window.PHASE7_STAGES || []),
  ...(window.PHASE8_STAGES || []),
  ...(window.PHASE9_STAGES || []),
  ...(window.PHASE10_STAGES || [])
];

console.log(`[ArchLingo] Unified 100-Stage Curriculum Loaded. Total stages: ${window.CURRICULUM_100.length}`);

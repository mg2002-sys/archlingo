/**
 * ArchLingo — Master System Design Application Controller (app.js)
 * 
 * Features:
 * - 100-Stage Winding Duolingo Skill Path Map with 10 Phase Headers & Archie Owl Mascot
 * - Instant Jump to Stage (1–100), Phase Filter & Real-Time Keyword Search
 * - "📘 Engineering Foundations & Prerequisite Terms" (Zero Trivial Analogies, SRE Rigor)
 * - "📐 Architecture & Physical Invariants" (Hardware constraints, packet flows, real math formulas)
 * - "💻 Production Implementation" (Syntax-highlighted code/config snippets)
 * - "🏢 Named Production Post-Mortem" (Documented outages from AWS, Google, Cloudflare, etc.)
 * - "🎛️ Interactive System Simulator Lab" (Dynamic P50/P99 latency, throughput & SLA calculations)
 * - "🎯 Stage Verification Challenge" (Multi-choice quizzes, instant feedback, live hearts deduction)
 * - Duolingo Celebration Advance Modal (Animated progress bar, XP counters, owl hop animation)
 * - Interactive Streak Modal (7-day calendar, streak freeze, daily bonus claim)
 */

class ArchLingoApp {
  constructor() {
    this.sections = window.SECTIONS_META || [];
    this.stages = (window.CURRICULUM_100 || []).map((s) => this.normalizeStage(s));
    this.state = this.loadState();
    this.activeStage = null;
    this.activeTab = "concept"; // "concept" | "quiz"
    this.currentQuestionIdx = 0;
    this.selectedOptionIdx = null;
    this.isAnswerSubmitted = false;
    this.correctCountInStage = 0;
    this.searchQuery = "";
    this.selectedSectionFilter = "all";
    this.toastTimer = null;

    this.init();
  }

  normalizeStage(stage) {
    if (!stage) return stage;

    const secId = stage.section || Math.ceil(stage.id / 10);
    stage.section = secId;

    const icons = ["", "🔌", "⚖️", "💾", "🗄️", "⚡", "🍩", "🗳️", "📨", "🛡️", "🏛️"];
    const sectionTitles = [
      "",
      "Phase 1: Internet, Networking & Web Protocol Foundations",
      "Phase 2: Web Architecture, Scaling & Traffic Distribution",
      "Phase 3: Hardware Invariants & Storage Engines from Scratch",
      "Phase 4: Relational Databases, Transactions & Replication",
      "Phase 5: High-Performance In-Memory Caching",
      "Phase 6: Partitioning, Sharding & Consistent Hashing",
      "Phase 7: Distributed Systems Theory, Consensus & Quorums",
      "Phase 8: Asynchronous Architecture, Event Streams & Message Brokers",
      "Phase 9: Microservices, APIs, Resilience & Security",
      "Phase 10: Senior Principal Real-World System Design Blueprints"
    ];

    stage.sectionTitle = stage.sectionTitle || stage.phase || sectionTitles[secId] || `Phase ${secId}`;
    stage.icon = stage.icon || icons[secId] || "📐";

    const companies = {
      51: "Vimeo", 52: "Discord", 53: "Cassandra", 54: "Google Bigtable", 55: "Slack",
      56: "Twitter", 57: "Elasticsearch", 58: "Stripe", 59: "Google Spanner", 60: "Uber",
      61: "GitHub", 62: "Cloudflare", 63: "Delta Airlines", 64: "Reddit", 65: "Cassandra",
      66: "GitGuardian", 67: "ZooKeeper", 68: "Cloudflare", 69: "CockroachDB", 70: "Google Spanner",
      71: "Netflix", 72: "Shopify", 73: "Deliveroo", 74: "Uber", 75: "LinkedIn",
      76: "Revolut", 77: "FinTech Ledger", 78: "Twitter", 79: "Monzo Bank", 80: "Airbnb",
      81: "Amazon", 82: "Robinhood", 83: "Google", 84: "Netflix", 85: "AWS DynamoDB",
      86: "GitHub", 87: "GitHub", 88: "Stripe", 89: "Uber", 90: "Capital One",
      91: "Bitly", 92: "Cloudflare", 93: "Discord", 94: "Discord", 95: "Prometheus",
      96: "Duolingo", 97: "Netflix", 98: "Target", 99: "Bing", 100: "Google Spanner"
    };
    stage.company = stage.company || companies[stage.id] || "Production Architecture";

    // Normalize questions / quiz
    if (!stage.questions && stage.quiz) {
      stage.questions = stage.quiz.map((q) => ({
        scenario: q.question,
        question: q.question,
        prompt: q.question,
        options: q.options,
        correctAnswer: q.answer !== undefined ? q.answer : 0,
        explanation: q.explanation
      }));
    } else if (stage.questions) {
      stage.questions = stage.questions.map((q) => ({
        ...q,
        question: q.question || q.scenario || q.prompt,
        prompt: q.prompt || q.scenario || q.question,
        scenario: q.scenario || q.question || q.prompt,
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : 0)
      }));
    } else {
      stage.questions = [];
    }

    // Normalize concept if missing
    if (!stage.concept) {
      stage.concept = {
        rawLessons: stage.lessons || [],
        beginnerGlossary: [
          {
            term: stage.title.replace(/^Stage \d+:\s*/, ""),
            plainEnglish: stage.subtitle || "Fundamental distributed systems invariant.",
            whyInvented: "Engineered to eliminate single-point-of-failure bottlenecks and scale under high concurrency.",
            howItWorks: "Enforces deterministic algorithms and state transitions verified across independent distributed nodes."
          }
        ],
        architectureCard: {
          title: "Architecture & Physical Invariants",
          physicalInvariant: stage.subtitle || "Strict hardware and network boundaries.",
          mentalModel: stage.subtitle || "Core system design architecture.",
          flowSteps: ["Client Request", "Gateway Router", "Consensus Log", "Storage Engine"],
          formulaTitle: "Capacity & Invariant Bounds",
          formulaMath: "P99 Latency = f(RTT, fsync, Quorum)",
          formulaExplanation: "Physical latency is bounded by the speed of light in fiber, disk fsync duration, and network consensus round-trips."
        },
        codeCard: {
          title: "Production Implementation",
          language: "go",
          code: "// Production distributed systems implementation",
          takeaway: "Always enforce strict idempotency, timeouts, and bounded capacities in production systems."
        },
        caseStudyCard: {
          company: stage.company,
          incidentOrChallenge: "Investigating distributed failure modes and mitigating cascading outages.",
          solution: "Architected fault-tolerant state machines with circuit breakers and consensus replication.",
          keyMetric: "Achieved 99.999% availability."
        },
        simulator: {
          param1Label: "Traffic Load / QPS",
          param1Min: 10,
          param1Max: 100,
          param1Default: 50,
          param2Label: "Concurrency / Nodes",
          param2Min: 1,
          param2Max: 64,
          param2Default: 16
        }
      };
    }

    return stage;
  }

  loadState() {
    const saved = localStorage.getItem("archlingo_100_state_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved state, using defaults", e);
      }
    }
    return {
      xp: 450,
      streakDays: 7,
      lastStreakClaimDate: null,
      streakFreezes: 2,
      hearts: 5,
      unlockedStage: 1,
      completedStages: [],
      unlockAllSandbox: false,
      weeklyDaysCompleted: [true, true, true, true, true, true, false] // Mon-Sun
    };
  }

  saveState() {
    localStorage.setItem("archlingo_100_state_v2", JSON.stringify(this.state));
    this.updateTopNavStats();
  }

  init() {
    this.renderTopNav();
    this.renderSectionFilterBar();
    this.renderSkillPathMap();
    this.bindGlobalEvents();
  }

  updateTopNavStats() {
    const streakEl = document.getElementById("nav-streak-count");
    const xpEl = document.getElementById("nav-xp-count");
    const heartsEl = document.getElementById("nav-hearts-count");
    const progressEl = document.getElementById("nav-stage-progress");
    const totalStages = this.stages.length || 100;

    if (streakEl) streakEl.textContent = this.state.streakDays;
    if (xpEl) xpEl.textContent = this.state.xp.toLocaleString();
    if (heartsEl) heartsEl.textContent = this.state.hearts;
    if (progressEl) {
      progressEl.textContent = `${this.state.completedStages.length} / ${totalStages} Stages Completed`;
    }
  }

  renderTopNav() {
    this.updateTopNavStats();
  }

  renderSectionFilterBar() {
    const container = document.getElementById("section-jump-bar");
    if (!container) return;

    const totalStages = this.stages.length || 100;

    const sectionOptions = this.sections
      .map(
        (sec) =>
          `<option value="${sec.id}">${sec.title} (Stages ${sec.stages[0]}–${sec.stages[1]})</option>`
      )
      .join("");

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-lg">🧭</span>
          <select id="section-select-dropdown" class="w-full bg-slate-100 dark:bg-slate-900 font-bold text-sm rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500">
            <option value="all">All 10 Phases (Stages 1 – ${totalStages})</option>
            ${sectionOptions}
          </select>
        </div>

        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <span class="text-lg">🔍</span>
          <input id="stage-search-input" type="text" placeholder="Search stages (e.g. DNS, LSM, Raft, Kafka, Cache)..."
            value="${this.searchQuery}"
            class="w-full bg-slate-100 dark:bg-slate-900 font-bold text-sm rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500" />
        </div>

        <div class="flex items-center gap-1.5">
          <input id="jump-stage-input" type="number" min="1" max="${totalStages}" placeholder="Stage # (1-${totalStages})"
            class="w-32 bg-slate-100 dark:bg-slate-900 font-bold text-xs rounded-xl px-2.5 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500" />
          <button id="btn-jump-stage" class="duo-btn-green px-3 py-1.5 text-xs">
            Go ➔
          </button>
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700">
          <input type="checkbox" id="toggle-sandbox-unlock" ${this.state.unlockAllSandbox ? "checked" : ""} class="rounded text-emerald-500 focus:ring-0" />
          <span class="text-xs font-extrabold text-amber-800 dark:text-amber-300">🔓 Unlock All ${totalStages} Stages</span>
        </label>
      </div>
    `;

    document.getElementById("section-select-dropdown")?.addEventListener("change", (e) => {
      this.selectedSectionFilter = e.target.value;
      this.renderSkillPathMap();
    });

    document.getElementById("stage-search-input")?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.renderSkillPathMap();
    });

    document.getElementById("toggle-sandbox-unlock")?.addEventListener("change", (e) => {
      this.state.unlockAllSandbox = e.target.checked;
      this.saveState();
      this.renderSkillPathMap();
    });

    const handleJumpStage = () => {
      const val = parseInt(document.getElementById("jump-stage-input")?.value, 10);
      if (!val || val < 1 || val > totalStages) {
        this.showToast(`Please enter a valid stage number between 1 and ${totalStages}!`);
        return;
      }
      this.state.unlockAllSandbox = true;
      this.saveState();
      this.openStageModal(val);
    };

    document.getElementById("btn-jump-stage")?.addEventListener("click", handleJumpStage);
    document.getElementById("jump-stage-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleJumpStage();
    });
  }

  renderSkillPathMap(animateHopFromStageId = null) {
    const mapContainer = document.getElementById("skill-path-container");
    if (!mapContainer) return;

    const totalStages = this.stages.length || 100;
    let filteredStages = this.stages;

    if (this.selectedSectionFilter !== "all") {
      const secId = parseInt(this.selectedSectionFilter, 10);
      filteredStages = filteredStages.filter((s) => s.section === secId);
    }

    if (this.searchQuery) {
      filteredStages = filteredStages.filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(this.searchQuery);
        const companyMatch = (s.company || "").toLowerCase().includes(this.searchQuery);
        const secMatch = (s.sectionTitle || "").toLowerCase().includes(this.searchQuery);
        return titleMatch || companyMatch || secMatch;
      });
    }

    if (filteredStages.length === 0) {
      mapContainer.innerHTML = `
        <div class="duo-card p-8 text-center my-8">
          <div class="text-4xl mb-2">🔍</div>
          <div class="font-black text-lg text-slate-800 dark:text-slate-100">No Stages Found</div>
          <p class="text-xs font-bold text-slate-400 mt-1">Try searching for keywords like "DNS", "LSM", "Raft", "Kafka", or "Cache".</p>
          <button onclick="window.app.resetFilters()" class="duo-btn-blue px-4 py-2 text-xs mt-4">Reset Filters</button>
        </div>
      `;
      return;
    }

    // Group filtered stages by Phase
    const stagesBySection = {};
    filteredStages.forEach((s) => {
      if (!stagesBySection[s.section]) stagesBySection[s.section] = [];
      stagesBySection[s.section].push(s);
    });

    let html = "";
    const xOffsets = [0, 52, 95, 52, 0, -52, -95, -52];

    Object.keys(stagesBySection).forEach((secKey) => {
      const secId = parseInt(secKey, 10);
      const meta = this.sections.find((sec) => sec.id === secId) || {
        title: `Phase ${secId}`,
        badge: `Phase ${secId}`,
        color: "#58cc02"
      };

      const sectionStages = stagesBySection[secId];
      const completedInSection = sectionStages.filter((s) => this.state.completedStages.includes(s.id)).length;

      html += `
        <div class="mt-8 mb-4">
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-3xl border-2 border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${(meta.badge || "").split(" ")[0] || "🚀"}</span>
              <div>
                <div class="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  ${meta.badge}
                </div>
                <h3 class="text-base sm:text-lg font-black text-white">
                  ${meta.title}
                </h3>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-right">
                <div class="text-xs font-black text-slate-300">
                  ${completedInSection} / ${sectionStages.length} Done
                </div>
                <div class="w-28 h-2.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-emerald-500 rounded-full transition-all" style="width: ${Math.round((completedInSection / sectionStages.length) * 100)}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center py-4 space-y-6">
      `;

      sectionStages.forEach((stage) => {
        const offsetIdx = (stage.id - 1) % xOffsets.length;
        const xTranslate = xOffsets[offsetIdx];

        const isCompleted = this.state.completedStages.includes(stage.id);
        const isCurrent = stage.id === this.state.unlockedStage;
        const isUnlocked = this.state.unlockAllSandbox || isCompleted || stage.id <= this.state.unlockedStage;

        let nodeClass = "stone-locked";
        if (isCompleted) {
          nodeClass = "stone-complete";
        } else if (isCurrent || (isUnlocked && !isCompleted)) {
          nodeClass = "stone-current";
        }

        const isArchieHere = isCurrent && !isCompleted;
        const animateHop = animateHopFromStageId === stage.id;

        html += `
          <div class="flex flex-col items-center relative transition-transform duration-300" style="transform: translateX(${xTranslate}px)">
            ${
              isArchieHere
                ? `
              <div class="absolute -top-14 z-20 flex flex-col items-center pointer-events-none ${animateHop ? "animate-archie-hop" : ""}">
                <div class="bg-emerald-500 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-lg border-2 border-emerald-400 speech-bubble whitespace-nowrap">
                  Start Stage ${stage.id}!
                </div>
                <div class="text-3xl -mt-1 select-none">🦉</div>
              </div>
            `
                : ""
            }

            <button
              id="stage-node-${stage.id}"
              onclick="window.app.openStageModal(${stage.id})"
              class="stone-node ${nodeClass}"
              title="Stage ${stage.id}: ${stage.title} (${stage.company})"
            >
              <span class="text-2xl">${isUnlocked ? stage.icon : "🔒"}</span>
              ${
                isCompleted
                  ? `<span class="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">★</span>`
                  : ""
              }
            </button>

            <div class="mt-1.5 text-center max-w-[200px]">
              <div class="text-xs font-black text-slate-700 dark:text-slate-200 leading-tight">
                Stage ${stage.id}: ${stage.title}
              </div>
              <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                ${stage.company} Case Study
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    mapContainer.innerHTML = html;

    if (animateHopFromStageId) {
      const targetEl = document.getElementById(`stage-node-${this.state.unlockedStage}`);
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    }
  }

  resetFilters() {
    this.searchQuery = "";
    this.selectedSectionFilter = "all";
    this.renderSectionFilterBar();
    this.renderSkillPathMap();
  }

  openStageModal(stageId) {
    const stage = this.stages.find((s) => s.id === stageId);
    if (!stage) return;

    const totalStages = this.stages.length || 100;
    const isUnlocked =
      this.state.unlockAllSandbox ||
      this.state.completedStages.includes(stageId) ||
      stageId <= this.state.unlockedStage;

    if (!isUnlocked) {
      this.showToast(`🔒 Complete Stage ${this.state.unlockedStage} first, or toggle "Unlock All ${totalStages} Stages" in the filter bar!`);
      return;
    }

    this.activeStage = stage;
    this.activeTab = "concept";
    this.currentQuestionIdx = 0;
    this.selectedOptionIdx = null;
    this.isAnswerSubmitted = false;
    this.correctCountInStage = 0;

    this.renderStageLessonModal();
    const modal = document.getElementById("stage-lesson-modal");
    if (modal) modal.classList.remove("hidden");
  }

  closeStageModal() {
    const modal = document.getElementById("stage-lesson-modal");
    if (modal) modal.classList.add("hidden");
    this.activeStage = null;
  }

  switchLessonTab(tabName) {
    this.activeTab = tabName;
    this.renderStageLessonModal();
  }

  renderMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks with syntax formatting
    html = html.replace(/```([a-z0-9_+-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="my-3 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-md">
        <div class="bg-slate-800 px-4 py-1.5 text-[11px] font-black uppercase text-emerald-400 border-b border-slate-700 flex justify-between items-center">
          <span>💻 ${lang || "code"}</span>
          <span class="text-slate-400 text-[10px]">PRODUCTION IMPLEMENTATION</span>
        </div>
        <pre class="p-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto text-emerald-200"><code>${code.trim()}</code></pre>
      </div>`;
    });

    // Math display blocks: $$ ... $$
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      return `<div class="my-3 bg-slate-900 text-emerald-400 font-mono text-center p-3 rounded-2xl border-2 border-slate-700 text-sm sm:text-base overflow-x-auto shadow-inner">
        ${formula.trim()}
      </div>`;
    });

    // Inline math: $ ... $
    html = html.replace(/\$([^\$\n]+)\$/g, '<code class="bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-mono text-xs border border-emerald-500/20">$1</code>');

    // Inline code: ` ... `
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-slate-100 dark:bg-slate-900 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md font-mono text-xs border border-slate-300 dark:border-slate-700">$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-black text-sm text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2"><span class="text-emerald-500">▶</span> $1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-black text-base text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">$1</h3>');

    // Bold & italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="text-xs font-bold text-slate-700 dark:text-slate-300 ml-4 list-disc my-1">$1</li>');

    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      if (match.includes("---")) return "";
      const cells = match.split("|").filter((c) => c.trim().length > 0);
      const cellHtml = cells.map((c) => `<td class="p-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">${c.trim()}</td>`).join("");
      return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">${cellHtml}</tr>`;
    });

    html = html.replace(/(<tr[\s\S]*?<\/tr>)+/g, (match) => {
      return `<div class="my-4 overflow-x-auto rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <table class="w-full text-left border-collapse bg-white dark:bg-slate-800">${match}</table>
      </div>`;
    });

    html = html.replace(/\n\n+/g, '<div class="my-2"></div>');

    return html;
  }

  renderStageLessonModal() {
    const stage = this.activeStage;
    if (!stage) return;

    const modalContent = document.getElementById("stage-lesson-content");
    if (!modalContent) return;

    const totalStages = this.stages.length || 100;
    const isConceptTab = this.activeTab === "concept";

    modalContent.innerHTML = `
      <!-- Lesson Modal Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${stage.icon}</span>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              STAGE ${stage.id} OF ${totalStages} • ${stage.sectionTitle}
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              ${stage.title}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Tab Switcher Pills -->
          <div class="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onclick="window.app.switchLessonTab('concept')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                isConceptTab
                  ? "bg-emerald-500 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }"
            >
              📖 1. Engineering Guide & Lab
            </button>
            <button
              onclick="window.app.switchLessonTab('quiz')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                !isConceptTab
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }"
            >
              🎯 2. Verification Challenge (${stage.questions.length} Qs)
            </button>
          </div>

          <button
            onclick="window.app.closeStageModal()"
            class="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center font-black text-slate-700 dark:text-slate-200"
            title="Close Stage"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Tab Body Content -->
      <div class="mt-5">
        ${isConceptTab ? this.renderConceptTabHtml(stage) : this.renderQuizTabHtml(stage)}
      </div>
    `;

    if (isConceptTab) {
      this.bindSimulatorSliders(stage);
    }
  }

  renderConceptTabHtml(stage) {
    // If rich lessons exist (Stages 51-100)
    if (stage.concept.rawLessons && stage.concept.rawLessons.length > 0) {
      const lessonsHtml = stage.concept.rawLessons.map((lesson, idx) => {
        let badgeColor = "bg-emerald-500 text-white";
        let icon = "📘";
        if (lesson.type === "architecture") { badgeColor = "bg-sky-500 text-white"; icon = "📐"; }
        if (lesson.type === "code") { badgeColor = "bg-slate-900 text-emerald-400"; icon = "💻"; }
        if (lesson.type === "postmortem") { badgeColor = "bg-purple-600 text-white"; icon = "🏢"; }
        if (lesson.type === "simulator") { badgeColor = "bg-amber-500 text-white"; icon = "🎛️"; }

        if (lesson.type === "simulator") {
          return `
            <div class="duo-card p-5 border-2 border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl ${badgeColor} shadow-sm">
                  ${icon} ${lesson.title}
                </span>
                <span class="text-xs font-extrabold text-amber-700 dark:text-amber-300">Live Telemetry Model</span>
              </div>
              <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4">
                Adjust operational load parameters to observe real-time queueing latency, saturation bounds, and SLA stability.
              </p>

              <!-- Sliders -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div class="flex justify-between text-xs font-black mb-1">
                    <span>Target Ingress Load / QPS</span>
                    <span id="sim-val-1" class="text-emerald-600 dark:text-emerald-400 font-mono">50</span>
                  </div>
                  <input id="sim-slider-1" type="range" min="10" max="100" value="50" class="w-full accent-emerald-500 cursor-pointer" />
                </div>
                <div>
                  <div class="flex justify-between text-xs font-black mb-1">
                    <span>Node Count / Shard Allocation</span>
                    <span id="sim-val-2" class="text-sky-600 dark:text-sky-400 font-mono">16</span>
                  </div>
                  <input id="sim-slider-2" type="range" min="1" max="64" value="16" class="w-full accent-sky-500 cursor-pointer" />
                </div>
              </div>

              <!-- Computed Telemetry Display -->
              <div class="grid grid-cols-3 gap-2.5 text-center">
                <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                  <div class="text-[10px] font-black uppercase text-slate-400">P99 Latency</div>
                  <div id="sim-out-latency" class="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">12.4 ms</div>
                </div>
                <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                  <div class="text-[10px] font-black uppercase text-slate-400">Throughput</div>
                  <div id="sim-out-throughput" class="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5 font-mono">125K QPS</div>
                </div>
                <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                  <div class="text-[10px] font-black uppercase text-slate-400">Availability</div>
                  <div id="sim-out-sla" class="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">99.999%</div>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="duo-card p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl ${badgeColor} shadow-sm">
                ${icon} ${lesson.title}
              </span>
              <span class="text-xs font-extrabold text-slate-400">Card ${idx + 1} of ${stage.concept.rawLessons.length}</span>
            </div>
            <div class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
              ${this.renderMarkdown(lesson.content)}
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
            <span class="text-3xl">${stage.icon || "🦉"}</span>
            <div>
              <div class="font-black text-sm text-slate-900 dark:text-white">
                Archie's Advanced Engineering Guide — ${stage.title}
              </div>
              <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                ${stage.subtitle || "Rigorous distributed systems foundations with zero analogies. Review lessons below, then verify with the Challenge Quiz."}
              </p>
            </div>
          </div>

          ${lessonsHtml}


          <!-- Proceed to Challenge CTA -->
          <div class="flex justify-end pt-2">
            <button
              onclick="window.app.switchLessonTab('quiz')"
              class="duo-btn-green px-6 py-3.5 text-base flex items-center gap-2 shadow-lg"
            >
              <span>START STAGE ${stage.id} CHALLENGE (${stage.questions.length} QUESTIONS)</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;
    }

    // Default Card Renderer (Stages 1-50)
    const { beginnerGlossary = [], architectureCard, codeCard, caseStudyCard, simulator } = stage.concept;

    const glossaryHtml = beginnerGlossary
      .map(
        (item) => `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div class="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span>📘</span>
              <span>${item.term}</span>
            </div>
            <div class="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
              <span class="text-slate-400 uppercase text-[10px] tracking-wider block font-black mb-0.5">Plain-English Definition</span>
              ${item.plainEnglish || item.definition}
            </div>
            <div class="mt-2 text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800">
              <span class="text-sky-600 dark:text-sky-400 uppercase text-[10px] tracking-wider block font-black mb-0.5">Why Engineers Invented It</span>
              ${item.whyInvented || "Solves single-point-of-failure and scaling bottlenecks in distributed systems."}
            </div>
          </div>
          <div class="mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <span class="text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider block font-black mb-0.5">How It Works Step-by-Step</span>
            ${item.howItWorks || "Executes deterministic state transitions to maintain consistency across cluster nodes."}
          </div>
        </div>
      `
      )
      .join("");

    const flowDiagramHtml = (architectureCard.flowSteps || [])
      .map(
        (step, idx) => `
        <div class="flex items-center gap-2">
          <div class="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl px-3 py-2 text-xs font-black text-emerald-900 dark:text-emerald-200 shadow-sm">
            <span class="text-emerald-600 dark:text-emerald-400 mr-1">${idx + 1}.</span> ${step}
          </div>
          ${
            idx < architectureCard.flowSteps.length - 1
              ? `<span class="text-slate-400 font-black text-sm">➔</span>`
              : ""
          }
        </div>
      `
      )
      .join("");

    return `
      <div class="space-y-6">
        <!-- Educational Intro Banner -->
        <div class="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
          <span class="text-3xl">🦉</span>
          <div>
            <div class="font-black text-sm text-slate-900 dark:text-white">
              Archie's Rigorous Concept Guide — Incremental Mastery from Silicon to Distributed Scale
            </div>
            <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
              Review the <strong>Engineering Foundations</strong> below, inspect physical invariants and architecture flows, examine ${stage.company}'s production incident, and experiment in the Simulator Lab!
            </p>
          </div>
        </div>

        <!-- 📘 PREREQUISITE FOUNDATIONS CARD -->
        <div class="duo-card p-5 border-2 border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-emerald-500 text-white shadow-sm">
              📘 Prerequisite Foundations & Core Terminology
            </span>
            <span class="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              Clear Technical Explanations • Zero Assumed Jargon
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-${Math.min(3, Math.max(1, beginnerGlossary.length))} gap-3.5">
            ${glossaryHtml}
          </div>
        </div>

        <!-- CARD 1: Core Architecture & Physical Invariants -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              📐 Card 1 of 3 • Architecture & Physical Invariants
            </span>
            <span class="text-xs font-bold text-slate-400">System Design Foundations</span>
          </div>

          ${
            architectureCard.physicalInvariant
              ? `
            <div class="mb-3 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border-2 border-emerald-500/30 rounded-xl p-3">
              <div class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                ⚡ Physical Hardware / Distributed Invariant
              </div>
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                ${architectureCard.physicalInvariant}
              </div>
            </div>
          `
              : ""
          }

          <p class="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
            ${architectureCard.mentalModel}
          </p>

          <!-- Request Flow Pipeline -->
          <div class="mb-4">
            <div class="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2">
              Step-by-Step Execution Flow:
            </div>
            <div class="flex flex-wrap items-center gap-2">
              ${flowDiagramHtml}
            </div>
          </div>

          <!-- Formula Box -->
          <div class="bg-slate-900 text-white rounded-2xl p-4 border-2 border-slate-700">
            <div class="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              🧮 ${architectureCard.formulaTitle}
            </div>
            <div class="text-lg sm:text-xl font-black text-emerald-400 font-mono my-1.5">
              ${architectureCard.formulaMath}
            </div>
            <div class="text-xs font-bold text-slate-300 leading-relaxed">
              ${architectureCard.formulaExplanation}
            </div>
          </div>
        </div>

        <!-- CARD 2: Production Implementation Snippet -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              💻 Card 2 of 3 • Production Code (${codeCard.language.toUpperCase()})
            </span>
            <span class="text-xs font-bold text-slate-400">${codeCard.title}</span>
          </div>

          <pre class="code-block p-4 text-xs sm:text-sm leading-relaxed overflow-x-auto"><code>${codeCard.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>

          <div class="mt-3 flex items-center gap-2 text-xs font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800">
            <span>💡</span>
            <span>Production Takeaway: ${codeCard.takeaway}</span>
          </div>
        </div>

        <!-- CARD 3: Named Real-World Production Post-Mortem -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
              🏢 Card 3 of 3 • Production Post-Mortem: ${caseStudyCard.company}
            </span>
            <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Documented Outage Study</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5">
              <div class="font-black text-rose-800 dark:text-rose-300 uppercase mb-1">🚨 Incident / Challenge</div>
              <p class="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${caseStudyCard.incidentOrChallenge}</p>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5">
              <div class="font-black text-emerald-800 dark:text-emerald-300 uppercase mb-1">🛠️ Architectural Fix</div>
              <p class="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${caseStudyCard.solution}</p>
            </div>
            <div class="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5">
              <div class="font-black text-sky-800 dark:text-sky-300 uppercase mb-1">📊 Quantitative Metric</div>
              <p class="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${caseStudyCard.keyMetric}</p>
            </div>
          </div>
        </div>

        <!-- 🎛️ INTERACTIVE SIMULATOR LAB -->
        <div class="duo-card p-5 border-2 border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-amber-500 text-white shadow-sm">
              🎛️ Interactive System Simulator Lab
            </span>
            <span class="text-xs font-extrabold text-amber-700 dark:text-amber-300">Live Mathematical Model</span>
          </div>
          <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4">
            Adjust system parameters to calculate dynamic throughput, queueing latency, and SLA degradation curves in real-time.
          </p>

          <div class="space-y-4">
            <!-- Sliders -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-xs font-black mb-1">
                  <span>${simulator.param1Label}</span>
                  <span id="sim-val-1" class="text-emerald-600 dark:text-emerald-400 font-mono">${simulator.param1Default}</span>
                </div>
                <input id="sim-slider-1" type="range"
                  min="${simulator.param1Min}" max="${simulator.param1Max}" value="${simulator.param1Default}"
                  class="w-full accent-emerald-500 cursor-pointer" />
              </div>

              <div>
                <div class="flex justify-between text-xs font-black mb-1">
                  <span>${simulator.param2Label}</span>
                  <span id="sim-val-2" class="text-sky-600 dark:text-sky-400 font-mono">${simulator.param2Default}</span>
                </div>
                <input id="sim-slider-2" type="range"
                  min="${simulator.param2Min}" max="${simulator.param2Max}" value="${simulator.param2Default}"
                  class="w-full accent-sky-500 cursor-pointer" />
              </div>
            </div>

            <!-- Live Computed Telemetry Display -->
            <div class="grid grid-cols-3 gap-2.5 text-center">
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="text-[10px] font-black uppercase text-slate-400">P99 Latency</div>
                <div id="sim-out-latency" class="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">14.2 ms</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="text-[10px] font-black uppercase text-slate-400">Throughput</div>
                <div id="sim-out-throughput" class="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5 font-mono">142K QPS</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="text-[10px] font-black uppercase text-slate-400">Availability</div>
                <div id="sim-out-sla" class="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">99.999%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Proceed to Challenge CTA -->
        <div class="flex justify-end pt-2">
          <button
            onclick="window.app.switchLessonTab('quiz')"
            class="duo-btn-green px-6 py-3.5 text-base flex items-center gap-2 shadow-lg"
          >
            <span>START STAGE ${stage.id} CHALLENGE (${stage.questions.length} QUESTIONS)</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  }

  bindSimulatorSliders(stage) {
    const s1 = document.getElementById("sim-slider-1");
    const s2 = document.getElementById("sim-slider-2");
    const v1 = document.getElementById("sim-val-1");
    const v2 = document.getElementById("sim-val-2");
    const outLat = document.getElementById("sim-out-latency");
    const outThr = document.getElementById("sim-out-throughput");
    const outSla = document.getElementById("sim-out-sla");

    const updateMetrics = () => {
      if (!s1 || !s2) return;
      const val1 = Number(s1.value);
      const val2 = Number(s2.value);
      if (v1) v1.textContent = val1;
      if (v2) v2.textContent = val2;

      // Realistic queueing delay & SLA model
      let latencyMs = (5 + val1 * 0.1 + val2 * 0.05).toFixed(1);
      let throughputVal = Math.round(val1 * Math.max(1, val2) * 1.2);
      let slaStr = "99.999%";

      if (stage.id <= 10) {
        latencyMs = (val1 * 0.4 + (1500 / Math.max(64, val2)) * 1.5).toFixed(1);
        throughputVal = Math.round(((val1 * 1000) / Math.max(64, val2)) * 8);
        slaStr = val1 > 80 ? "99.95%" : "99.999%";
      } else if (stage.id <= 30) {
        latencyMs = Math.max(0.2, val1 * 0.02 + val2 * 0.1).toFixed(2);
        throughputVal = Math.round(50000 / (1 + val1 * 0.05));
        slaStr = val1 > 80 ? "99.90%" : "99.999%";
      } else {
        const loadFactor = val1 / (val2 * 500);
        if (loadFactor > 0.85) {
          latencyMs = (15 / (1 - Math.min(0.98, loadFactor))).toFixed(1);
          slaStr = loadFactor > 0.95 ? "99.50%" : "99.90%";
        } else {
          latencyMs = (8 + loadFactor * 12).toFixed(1);
          slaStr = "99.999%";
        }
      }

      if (outLat) outLat.textContent = `${latencyMs} ms`;
      if (outThr) outThr.textContent = `${throughputVal.toLocaleString()} QPS`;
      if (outSla) outSla.textContent = slaStr;
    };

    s1?.addEventListener("input", updateMetrics);
    s2?.addEventListener("input", updateMetrics);
    updateMetrics();
  }

  renderQuizTabHtml(stage) {
    const q = stage.questions[this.currentQuestionIdx];
    const questionText = q.question || q.prompt || q.scenario;
    const correctIdx = q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex;
    const progressPct = Math.round(((this.currentQuestionIdx) / stage.questions.length) * 100);

    const optionsHtml = q.options
      .map((opt, idx) => {
        let btnStyle = "duo-btn-outline";
        if (this.selectedOptionIdx === idx) {
          btnStyle = "border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300";
        }
        if (this.isAnswerSubmitted) {
          if (idx === correctIdx) {
            btnStyle = "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200";
          } else if (this.selectedOptionIdx === idx && idx !== correctIdx) {
            btnStyle = "bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200";
          }
        }

        return `
          <button
            onclick="window.app.selectQuizOption(${idx})"
            ${this.isAnswerSubmitted ? "disabled" : ""}
            class="w-full text-left p-4 rounded-2xl border-2 font-bold text-sm transition flex items-center gap-3 ${btnStyle}"
          >
            <span class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-xs">
              ${String.fromCharCode(65 + idx)}
            </span>
            <span class="flex-1">${opt}</span>
          </button>
        `;
      })
      .join("");

    return `
      <div class="space-y-6">
        <!-- Duolingo Top Quiz Progress Bar -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
          </div>
          <span class="text-xs font-black text-slate-500">
            ${this.currentQuestionIdx + 1} / ${stage.questions.length}
          </span>
        </div>

        <!-- Question Prompt Card -->
        <div class="duo-card p-5">
          <div class="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">
            Stage ${stage.id} Verification Challenge
          </div>
          <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
            ${questionText}
          </h3>

          <div class="mt-4 space-y-3">
            ${optionsHtml}
          </div>
        </div>

        <!-- Bottom Check / Next Action Banner -->
        <div class="pt-2">
          ${
            !this.isAnswerSubmitted
              ? `
            <div class="flex justify-between items-center">
              <button onclick="window.app.switchLessonTab('concept')" class="duo-btn-outline px-4 py-2.5 text-xs">
                ← Review Concept
              </button>
              <button
                onclick="window.app.submitQuizAnswer()"
                ${this.selectedOptionIdx === null ? "disabled" : ""}
                class="duo-btn-green px-6 py-3 text-sm font-black shadow-md ${
                  this.selectedOptionIdx === null ? "opacity-50 cursor-not-allowed" : ""
                }"
              >
                CHECK ANSWER
              </button>
            </div>
          `
              : `
            <div class="rounded-2xl p-4 border-2 ${
              this.selectedOptionIdx === correctIdx
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500"
                : "bg-rose-50 dark:bg-rose-950/60 border-rose-500"
            }">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">${this.selectedOptionIdx === correctIdx ? "🎉" : "💔"}</span>
                  <div>
                    <div class="font-black text-sm ${
                      this.selectedOptionIdx === correctIdx
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-rose-800 dark:text-rose-300"
                    }">
                      ${this.selectedOptionIdx === correctIdx ? "Excellent Solution!" : "Incorrect Solution (-1 Heart)"}
                    </div>
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      ${q.explanation}
                    </p>
                  </div>
                </div>

                <button
                  onclick="window.app.nextQuizQuestion()"
                  class="${
                    this.selectedOptionIdx === correctIdx ? "duo-btn-green" : "duo-btn-rose"
                  } px-5 py-2.5 text-xs whitespace-nowrap shadow-md"
                >
                  ${this.currentQuestionIdx < stage.questions.length - 1 ? "CONTINUE ➔" : "COMPLETE STAGE ★"}
                </button>
              </div>
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  selectQuizOption(idx) {
    if (this.isAnswerSubmitted) return;
    this.selectedOptionIdx = idx;
    this.renderStageLessonModal();
  }

  submitQuizAnswer() {
    if (this.selectedOptionIdx === null || this.isAnswerSubmitted) return;
    const stage = this.activeStage;
    const q = stage.questions[this.currentQuestionIdx];
    const correctIdx = q.correctAnswer !== undefined ? q.correctAnswer : q.correctIndex;

    this.isAnswerSubmitted = true;

    if (this.selectedOptionIdx === correctIdx) {
      this.correctCountInStage++;
      this.state.xp += 15;
      this.saveState();
    } else {
      this.state.hearts = Math.max(0, this.state.hearts - 1);
      this.saveState();
      if (this.state.hearts === 0) {
        this.showToast("💔 You ran out of hearts! Click the heart in the top bar to refill!");
      }
    }

    this.renderStageLessonModal();
  }

  nextQuizQuestion() {
    const stage = this.activeStage;
    if (this.currentQuestionIdx < stage.questions.length - 1) {
      this.currentQuestionIdx++;
      this.selectedOptionIdx = null;
      this.isAnswerSubmitted = false;
      this.renderStageLessonModal();
    } else {
      this.completeStage(stage);
    }
  }

  completeStage(stage) {
    this.closeStageModal();

    const alreadyCompleted = this.state.completedStages.includes(stage.id);
    if (!alreadyCompleted) {
      this.state.completedStages.push(stage.id);
    }

    const previousUnlocked = this.state.unlockedStage;
    if (stage.id >= this.state.unlockedStage && this.state.unlockedStage < this.stages.length) {
      this.state.unlockedStage = stage.id + 1;
    }

    this.state.xp += 50;

    const todayStr = new Date().toISOString().slice(0, 10);
    if (this.state.lastStreakClaimDate !== todayStr) {
      this.state.streakDays += 1;
      this.state.lastStreakClaimDate = todayStr;
      const dayIdx = (new Date().getDay() + 6) % 7;
      this.state.weeklyDaysCompleted[dayIdx] = true;
    }

    this.saveState();

    this.renderSkillPathMap(previousUnlocked);
    this.openCelebrationModal(stage);
  }

  openCelebrationModal(stage) {
    const modal = document.getElementById("celebration-modal");
    if (!modal) return;

    const totalStages = this.stages.length || 100;
    const completedCount = this.state.completedStages.length;
    const progressPct = Math.round((completedCount / totalStages) * 100);

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="duo-card max-w-md w-full p-6 text-center space-y-5 animate-scale-up border-4 border-emerald-500 shadow-2xl">
          <div class="text-6xl animate-bounce">🦉✨</div>
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              STAGE ${stage.id} MASTERED!
            </span>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white mt-2">
              Outstanding Engineering!
            </h2>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              You mastered the physical invariants and verified the code for <strong>${stage.title}</strong>!
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700">
              <div class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Total XP Earned</div>
              <div class="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">+65 XP</div>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700">
              <div class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Streak Maintained</div>
              <div class="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">${this.state.streakDays} Days 🔥</div>
            </div>
          </div>

          <!-- Overall Curriculum Progress -->
          <div class="space-y-1.5 text-left">
            <div class="flex justify-between text-xs font-black text-slate-600 dark:text-slate-300">
              <span>Overall Curriculum Mastery</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-mono">${completedCount} / ${totalStages} Stages (${progressPct}%)</span>
            </div>
            <div class="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-700" style="width: ${progressPct}%"></div>
            </div>
          </div>

          <button
            onclick="window.app.closeCelebrationModal()"
            class="duo-btn-green w-full py-3.5 text-sm font-black shadow-lg"
          >
            CONTINUE ON THE PATH ➔
          </button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeCelebrationModal() {
    const modal = document.getElementById("celebration-modal");
    if (modal) modal.classList.add("hidden");
  }

  refillHearts() {
    this.state.hearts = 5;
    this.saveState();
    this.showToast("❤️ Hearts refilled to 5/5!");
  }

  openStreakModal() {
    const modal = document.getElementById("streak-modal");
    if (!modal) return;

    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const daysHtml = days
      .map((d, idx) => {
        const isCompleted = this.state.weeklyDaysCompleted[idx];
        return `
          <div class="flex flex-col items-center gap-1.5">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${
              isCompleted
                ? "bg-amber-400 border-amber-500 text-amber-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400"
            }">
              ${isCompleted ? "✓" : d}
            </div>
            <span class="text-[10px] font-black text-slate-400">${d}</span>
          </div>
        `;
      })
      .join("");

    const todayStr = new Date().toISOString().slice(0, 10);
    const alreadyClaimedToday = this.state.lastStreakClaimDate === todayStr;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="duo-card max-w-sm w-full p-6 text-center space-y-5 animate-scale-up border-4 border-amber-400 shadow-2xl relative">
          <button onclick="window.app.closeStreakModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-lg">✕</button>
          
          <div class="text-6xl animate-pulse">🔥</div>
          <div>
            <h2 class="text-3xl font-black text-slate-900 dark:text-white">
              ${this.state.streakDays} Day Streak!
            </h2>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
              Practice every day to build permanent distributed systems mastery!
            </p>
          </div>

          <!-- 7-Day Calendar -->
          <div class="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
            ${daysHtml}
          </div>

          <!-- Streak Freeze Shield -->
          <div class="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center justify-between text-left">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🧊</span>
              <div>
                <div class="text-xs font-black text-sky-900 dark:text-sky-200">Streak Freeze Equipped</div>
                <div class="text-[10px] font-bold text-sky-600 dark:text-sky-400">Protects streak for 1 missed day</div>
              </div>
            </div>
            <span class="font-mono font-black text-sm text-sky-700 dark:text-sky-300">${this.state.streakFreezes}/2</span>
          </div>

          <button
            onclick="window.app.claimDailyStreakBonus()"
            ${alreadyClaimedToday ? "disabled" : ""}
            class="w-full ${alreadyClaimedToday ? "duo-btn-outline opacity-75" : "duo-btn-gold"} py-3.5 text-sm font-black shadow-md"
          >
            ${
              alreadyClaimedToday
                ? "✅ TODAY'S STREAK BONUS CLAIMED! COME BACK TOMORROW"
                : "🔥 EXTEND STREAK & CLAIM DAILY BONUS (+50 XP)"
            }
          </button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
  }

  closeStreakModal() {
    const modal = document.getElementById("streak-modal");
    if (modal) modal.classList.add("hidden");
  }

  claimDailyStreakBonus() {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (this.state.lastStreakClaimDate === todayStr) {
      this.showToast("You already claimed today's streak bonus!");
      return;
    }

    this.state.streakDays += 1;
    this.state.xp += 50;
    this.state.lastStreakClaimDate = todayStr;
    const dayIdx = (new Date().getDay() + 6) % 7;
    this.state.weeklyDaysCompleted[dayIdx] = true;

    this.saveState();
    this.openStreakModal();
    this.showToast(`🔥 Streak extended to ${this.state.streakDays} days! +50 XP added!`);
  }

  showToast(message) {
    const toast = document.getElementById("app-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3200);
  }

  bindGlobalEvents() {
    document.getElementById("btn-open-streak")?.addEventListener("click", () => {
      this.openStreakModal();
    });

    document.getElementById("btn-refill-hearts")?.addEventListener("click", () => {
      this.refillHearts();
    });

    document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new ArchLingoApp();
});

/**
 * ArchLingo — Modular Application Controller (js/app.js)
 * Handles:
 *  - 100-Stage Winding Duolingo Skill Path Map with Section Headers
 *  - Deep Concept View (3 Rich Concept Cards + Live Interactive Simulator)
 *  - Interactive Quiz Engine with Duolingo Bottom Feedback Banner & Live Hearts Deduction
 *  - Authentic Duolingo Stage Complete & Advance Modal with Animated Progress Bar & XP Counter + Archie Owl Hop Animation
 *  - Functioning Streak Button & Interactive Streak Modal with 7-Day Calendar & Streak Freeze
 */

class ArchLingoApp {
  constructor() {
    this.stages = window.CURRICULUM_100 || [];
    this.sections = window.SECTIONS_META || [];
    this.state = this.loadState();
    this.activeStage = null;
    this.activeTab = "concept"; // "concept" | "quiz"
    this.currentQuestionIdx = 0;
    this.selectedOptionIdx = null;
    this.isAnswerSubmitted = false;
    this.correctCountInStage = 0;
    this.searchQuery = "";
    this.selectedSectionFilter = "all";

    this.init();
  }

  loadState() {
    const saved = localStorage.getItem("archlingo_100_state_v3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved state, using defaults", e);
      }
    }
    return {
      xp: 350,
      streakDays: 7,
      lastStreakClaimDate: null,
      streakFreezes: 2,
      hearts: 5,
      unlockedStage: 1,
      completedStages: [],
      unlockAllSandbox: false,
      weeklyDaysCompleted: [true, true, true, true, true, false, false] // Mon-Sun
    };
  }

  saveState() {
    localStorage.setItem("archlingo_100_state_v3", JSON.stringify(this.state));
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

    if (streakEl) streakEl.textContent = this.state.streakDays;
    if (xpEl) xpEl.textContent = this.state.xp.toLocaleString();
    if (heartsEl) heartsEl.textContent = this.state.hearts;
    if (progressEl) {
      progressEl.textContent = `${this.state.completedStages.length} / 100 Stages Completed`;
    }
  }

  renderTopNav() {
    this.updateTopNavStats();
  }

  renderSectionFilterBar() {
    const container = document.getElementById("section-jump-bar");
    if (!container) return;

    const sectionOptions = this.sections
      .map(
        (sec) =>
          `<option value="${sec.id}">Section ${sec.id}: ${sec.title.replace(/^Section \d+:\s*/, "")} (Stages ${sec.stages[0]}-${sec.stages[1]})</option>`
      )
      .join("");

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="flex items-center gap-2 flex-1 min-w-[220px]">
          <span class="text-lg">🧭</span>
          <select id="section-select-dropdown" class="w-full bg-slate-100 dark:bg-slate-900 font-bold text-sm rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500">
            <option value="all">All 10 Sections (Stages 1 – 100)</option>
            ${sectionOptions}
          </select>
        </div>

        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <span class="text-lg">🔍</span>
          <input id="stage-search-input" type="text" placeholder="Search 100 stages (e.g. Raft, Spanner, Cache)..."
            value="${this.searchQuery}"
            class="w-full bg-slate-100 dark:bg-slate-900 font-bold text-sm rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500" />
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700">
          <input type="checkbox" id="toggle-sandbox-unlock" ${this.state.unlockAllSandbox ? "checked" : ""} class="rounded text-emerald-500 focus:ring-0" />
          <span class="text-xs font-extrabold text-amber-800 dark:text-amber-300">🔓 Unlock All 100 Stages</span>
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
  }

  renderSkillPathMap(animateHopFromStageId = null) {
    const mapContainer = document.getElementById("skill-path-container");
    if (!mapContainer) return;

    let html = "";

    const filteredSections = this.sections.filter(
      (sec) => this.selectedSectionFilter === "all" || String(sec.id) === String(this.selectedSectionFilter)
    );

    filteredSections.forEach((sec) => {
      const sectionStages = this.stages.filter(
        (s) =>
          s.section === sec.id &&
          (!this.searchQuery ||
            s.title.toLowerCase().includes(this.searchQuery) ||
            s.company.toLowerCase().includes(this.searchQuery) ||
            `stage ${s.id}`.includes(this.searchQuery))
      );

      if (sectionStages.length === 0) return;

      // Section Duolingo Banner
      html += `
        <div id="section-banner-${sec.id}" class="w-full max-w-2xl mx-auto mb-8 mt-6 rounded-2xl p-5 text-white shadow-md flex items-center justify-between"
             style="background-color: ${sec.color}; border-bottom: 5px solid rgba(0,0,0,0.22);">
          <div>
            <div class="text-xs uppercase tracking-wider font-black opacity-90">${sec.badge} • STAGES ${sec.stages[0]}–${sec.stages[1]}</div>
            <h2 class="text-xl sm:text-2xl font-black mt-0.5">${sec.title}</h2>
          </div>
          <div class="bg-white/20 backdrop-blur-sm px-3.5 py-2 rounded-xl font-black text-sm">
            ${sectionStages.filter((st) => this.state.completedStages.includes(st.id)).length} / ${sectionStages.length} ⭐
          </div>
        </div>
      `;

      // Winding Stepping Stones
      html += `<div class="flex flex-col items-center space-y-6 pb-8">`;

      sectionStages.forEach((stage, idx) => {
        const isCompleted = this.state.completedStages.includes(stage.id);
        const isCurrent = stage.id === this.state.unlockedStage;
        const isUnlocked =
          this.state.unlockAllSandbox || isCompleted || stage.id <= this.state.unlockedStage;

        // Calculate sinusoidal horizontal offset for Duolingo winding path feel
        const offsets = [0, 48, 80, 48, 0, -48, -80, -48];
        const offsetPx = offsets[idx % offsets.length];

        let stoneClass = "stone-locked";
        if (isCompleted) stoneClass = "stone-complete";
        else if (isCurrent) stoneClass = "stone-current";
        else if (isUnlocked) stoneClass = "stone-complete";

        const showArchieHere = isCurrent;
        const shouldAnimateHop = animateHopFromStageId && isCurrent;

        html += `
          <div id="stage-node-${stage.id}" class="relative flex flex-col items-center group"
               style="transform: translateX(${offsetPx}px);">
            ${
              showArchieHere
                ? `
              <div id="archie-owl-mascot" class="mb-2 flex flex-col items-center ${
                shouldAnimateHop ? "animate-archie-hop" : ""
              }">
                <div class="speech-bubble bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-black px-3 py-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md mb-1 whitespace-nowrap">
                  ${shouldAnimateHop ? `🎉 Advanced to Stage ${stage.id}!` : `🦉 Start Stage ${stage.id}!`}
                </div>
                <div class="text-4xl filter drop-shadow">🦉</div>
              </div>
            `
                : ""
            }

            <button
              onclick="window.app.openStageModal(${stage.id})"
              class="stone-node ${stoneClass}"
              title="Stage ${stage.id}: ${stage.title} (${stage.company})"
            >
              <span class="text-2xl">${isUnlocked ? stage.icon : "🔒"}</span>
              ${
                isCompleted
                  ? `<span class="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">★</span>`
                  : ""
              }
            </button>

            <div class="mt-1.5 text-center max-w-[170px]">
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

  openStageModal(stageId) {
    const stage = this.stages.find((s) => s.id === stageId);
    if (!stage) return;

    const isUnlocked =
      this.state.unlockAllSandbox ||
      this.state.completedStages.includes(stageId) ||
      stageId <= this.state.unlockedStage;

    if (!isUnlocked) {
      this.showToast(`🔒 Complete Stage ${this.state.unlockedStage} first, or toggle "Unlock All 100 Stages" in the filter bar!`);
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

  renderStageLessonModal() {
    const stage = this.activeStage;
    if (!stage) return;

    const modalContent = document.getElementById("stage-lesson-content");
    if (!modalContent) return;

    const isConceptTab = this.activeTab === "concept";

    modalContent.innerHTML = `
      <!-- Lesson Modal Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${stage.icon}</span>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              STAGE ${stage.id} OF 100 • ${stage.sectionTitle}
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
              📖 1. Deep Concept & Lab
            </button>
            <button
              onclick="window.app.switchLessonTab('quiz')"
              class="px-3.5 py-1.5 rounded-lg text-xs font-black transition ${
                !isConceptTab
                  ? "bg-sky-500 text-white shadow"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }"
            >
              🎯 2. Stage Challenge (${stage.questions.length} Qs)
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
    const { architectureCard, codeCard, caseStudyCard, simulator } = stage.concept;

    const flowDiagramHtml = architectureCard.flowSteps
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
              Archie's Deep Concept Guide — Master the Architecture Before the Challenge!
            </div>
            <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
              Study the 3 Architecture Cards below (Mental Model & SLA Formula, Production Code, and ${stage.company}'s Real-World Case Study), then test your understanding in the Interactive Architecture Lab!
            </p>
          </div>
        </div>

        <!-- CARD 1: Core Architecture & Mathematical SLA Formula -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              📐 Card 1 of 3 • Core Architecture & SLA Formula
            </span>
            <span class="text-xs font-bold text-slate-400">System Design Foundations</span>
          </div>

          <p class="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
            ${architectureCard.mentalModel}
          </p>

          <!-- Request Flow Pipeline -->
          <div class="mb-4">
            <div class="text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2">
              Architecture Request Pipeline Flow:
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

        <!-- CARD 2: Under the Hood Production Config / Code Snippet -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              💻 Card 2 of 3 • Under the Hood Production Code (${codeCard.language.toUpperCase()})
            </span>
            <span class="text-xs font-bold text-slate-400">${codeCard.title}</span>
          </div>

          <pre class="code-block p-4 text-xs sm:text-sm leading-relaxed overflow-x-auto"><code>${codeCard.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>

          <div class="mt-3 flex items-center gap-2 text-xs font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800">
            <span>💡</span>
            <span>Production Takeaway: ${codeCard.takeaway}</span>
          </div>
        </div>

        <!-- CARD 3: Real-World Engineering Case Study -->
        <div class="duo-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
              🏢 Card 3 of 3 • Real-World Case Study: ${caseStudyCard.company}
            </span>
            <span class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Verified Production Impact</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5">
              <div class="font-black text-rose-800 dark:text-rose-300 uppercase mb-1">🚨 Production Bottleneck</div>
              <p class="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${caseStudyCard.incidentOrChallenge}</p>
            </div>

            <div class="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5">
              <div class="font-black text-sky-800 dark:text-sky-300 uppercase mb-1">🛠️ Engineering Solution</div>
              <p class="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${caseStudyCard.solution}</p>
            </div>

            <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5">
              <div class="font-black text-emerald-800 dark:text-emerald-300 uppercase mb-1">📈 Benchmark Result</div>
              <p class="font-black text-emerald-900 dark:text-emerald-200 text-sm leading-relaxed">${caseStudyCard.keyMetric}</p>
            </div>
          </div>
        </div>

        <!-- INTERACTIVE LIVE ARCHITECTURE SIMULATOR LAB -->
        <div class="duo-card p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800 dark:to-slate-900">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              🎛️ Interactive System Design Simulator Lab
            </span>
            <span class="text-xs font-bold text-slate-500">Adjust sliders to test live SLA metrics</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs font-black mb-1">
                  <span>${simulator.param1Label}</span>
                  <span id="sim-val-1" class="text-emerald-600 dark:text-emerald-400">${simulator.param1Default}</span>
                </div>
                <input id="sim-slider-1" type="range"
                  min="${simulator.param1Min}" max="${simulator.param1Max}" value="${simulator.param1Default}"
                  class="w-full accent-emerald-500 cursor-pointer" />
              </div>

              <div>
                <div class="flex justify-between text-xs font-black mb-1">
                  <span>${simulator.param2Label}</span>
                  <span id="sim-val-2" class="text-sky-600 dark:text-sky-400">${simulator.param2Default}</span>
                </div>
                <input id="sim-slider-2" type="range"
                  min="${simulator.param2Min}" max="${simulator.param2Max}" value="${simulator.param2Default}"
                  class="w-full accent-sky-500 cursor-pointer" />
              </div>
            </div>

            <!-- Live Computed Telemetry Display -->
            <div class="grid grid-cols-3 gap-2.5 text-center">
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <div class="text-[10px] font-black uppercase text-slate-400">P99 Latency</div>
                <div id="sim-out-latency" class="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">14.2 ms</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <div class="text-[10px] font-black uppercase text-slate-400">Throughput</div>
                <div id="sim-out-throughput" class="text-lg font-black text-sky-600 dark:text-sky-400 mt-0.5">142K RPS</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <div class="text-[10px] font-black uppercase text-slate-400">Availability</div>
                <div id="sim-out-sla" class="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">99.999%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Proceed to Challenge CTA -->
        <div class="flex justify-end pt-2">
          <button
            onclick="window.app.switchLessonTab('quiz')"
            class="duo-btn-green px-6 py-3.5 text-base flex items-center gap-2"
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

      const latencyMs = Math.max(1.8, (120 / Math.max(1, val2)) * (105 - val1 * 0.6) * 0.1).toFixed(1);
      const throughputK = Math.round(val1 * val2 * 0.85);
      const slaNines = val2 >= 9 ? "99.999%" : val2 >= 5 ? "99.99%" : "99.9%";

      if (outLat) outLat.textContent = `${latencyMs} ms`;
      if (outThr) outThr.textContent = `${throughputK}K RPS`;
      if (outSla) outSla.textContent = slaNines;
    };

    s1?.addEventListener("input", updateMetrics);
    s2?.addEventListener("input", updateMetrics);
    updateMetrics();
  }

  renderQuizTabHtml(stage) {
    const q = stage.questions[this.currentQuestionIdx];
    const progressPct = Math.round(((this.currentQuestionIdx) / stage.questions.length) * 100);

    const optionsHtml = q.options
      .map((opt, idx) => {
        let btnStyle = "duo-btn-outline";
        if (this.selectedOptionIdx === idx) {
          btnStyle = "border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300";
        }
        if (this.isAnswerSubmitted) {
          if (idx === q.correctIndex) {
            btnStyle = "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200";
          } else if (this.selectedOptionIdx === idx && idx !== q.correctIndex) {
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
            ${q.prompt}
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
                class="duo-btn-green px-7 py-3 text-sm"
              >
                CHECK ANSWER
              </button>
            </div>
          `
              : `
            <div class="p-4 rounded-2xl border-2 ${
              this.selectedOptionIdx === q.correctIndex
                ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-900 dark:text-rose-200"
            } flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div class="font-black text-base flex items-center gap-2">
                  <span>${this.selectedOptionIdx === q.correctIndex ? "✅ Awesome! Correct!" : "❌ Keep learning! (-1 ❤️)"}</span>
                </div>
                <p class="text-xs font-bold mt-1 opacity-90">${q.explanation}</p>
              </div>
              <button
                onclick="window.app.nextQuizQuestion()"
                class="${this.selectedOptionIdx === q.correctIndex ? "duo-btn-green" : "duo-btn-blue"} px-6 py-3 text-sm whitespace-nowrap"
              >
                ${this.currentQuestionIdx + 1 < stage.questions.length ? "CONTINUE ➔" : "FINISH STAGE 🎉"}
              </button>
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
    if (this.selectedOptionIdx === null) {
      this.showToast("Please select an answer choice first!");
      return;
    }
    const q = this.activeStage.questions[this.currentQuestionIdx];
    this.isAnswerSubmitted = true;
    if (this.selectedOptionIdx === q.correctIndex) {
      this.correctCountInStage++;
    } else {
      // Decrement heart & trigger shake animation
      if (this.state.hearts > 0) {
        this.state.hearts -= 1;
      }
      this.saveState();
      const heartPill = document.getElementById("btn-refill-hearts");
      if (heartPill) {
        heartPill.classList.remove("animate-shake");
        void heartPill.offsetWidth; // Reflow
        heartPill.classList.add("animate-shake");
      }
      if (this.state.hearts === 0) {
        this.showToast("💔 Out of hearts! Click the ❤️ icon in the top bar to refill hearts for free!");
      }
    }
    this.renderStageLessonModal();
  }

  refillHearts() {
    if (this.state.hearts >= 5) {
      this.showToast("❤️ Your hearts are already full (5/5)!");
      return;
    }
    this.state.hearts = 5;
    this.saveState();
    this.showToast("❤️ Hearts refilled to 5/5! Keep mastering System Design!");
  }

  nextQuizQuestion() {
    const stage = this.activeStage;
    if (this.currentQuestionIdx + 1 < stage.questions.length) {
      this.currentQuestionIdx++;
      this.selectedOptionIdx = null;
      this.isAnswerSubmitted = false;
      this.renderStageLessonModal();
    } else {
      this.completeStage(stage);
    }
  }

  completeStage(stage) {
    const earnedXp = 50;
    this.state.xp += earnedXp;

    if (!this.state.completedStages.includes(stage.id)) {
      this.state.completedStages.push(stage.id);
    }

    const previousUnlocked = this.state.unlockedStage;
    const nextStageId = Math.min(100, stage.id + 1);
    if (stage.id >= this.state.unlockedStage && this.state.unlockedStage < 100) {
      this.state.unlockedStage = nextStageId;
    }

    this.saveState();
    this.closeStageModal();
    this.openStageAdvanceModal(stage, nextStageId, earnedXp, previousUnlocked);
  }

  openStageAdvanceModal(completedStage, nextStageId, earnedXp, previousUnlocked) {
    const modal = document.getElementById("stage-advance-modal");
    const content = document.getElementById("stage-advance-content");
    if (!modal || !content) return;

    const nextStageObj = this.stages.find((s) => s.id === nextStageId) || completedStage;

    content.innerHTML = `
      <div class="text-center space-y-5 py-3">
        <div class="text-6xl animate-bounce">🏆</div>
        <div>
          <div class="text-xs font-black uppercase tracking-widest text-amber-500">
            STAGE ${completedStage.id} COMPLETE!
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Advancing to Stage ${nextStageId}!
          </h2>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-300 mt-1">
            Up Next: <span class="text-emerald-600 dark:text-emerald-400 font-black">Stage ${nextStageObj.id}: ${nextStageObj.title}</span>
          </p>
        </div>

        <!-- Animated Duolingo Progress Bar from Stage X -> Stage X+1 -->
        <div class="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
          <div class="flex justify-between text-xs font-black mb-2">
            <span class="text-emerald-600">Stage ${completedStage.id} ★</span>
            <span class="text-amber-500">Advancing ➔ Stage ${nextStageId}</span>
          </div>
          <div class="w-full h-5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div id="stage-advance-progress-fill" class="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-1000 ease-out" style="width: 0%"></div>
          </div>
        </div>

        <!-- Rewards Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="duo-card p-3 bg-amber-50 dark:bg-amber-950/40 border-amber-300">
            <div class="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">XP Earned</div>
            <div id="stage-advance-xp-counter" class="text-xl font-black text-amber-600 mt-0.5">+0 ⚡</div>
          </div>
          <div class="duo-card p-3 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
            <div class="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Streak</div>
            <div class="text-xl font-black text-emerald-600 mt-0.5">🔥 ${this.state.streakDays}d</div>
          </div>
          <div class="duo-card p-3 bg-sky-50 dark:bg-sky-950/40 border-sky-300">
            <div class="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300">Total Completed</div>
            <div class="text-xl font-black text-sky-600 mt-0.5">${this.state.completedStages.length}/100</div>
          </div>
        </div>

        <button
          onclick="window.app.confirmAdvanceToNextStage(${completedStage.id})"
          class="w-full duo-btn-green py-4 text-base font-black shadow-lg"
        >
          CONTINUE TO STAGE ${nextStageId} ON SKILL PATH ➔
        </button>
      </div>
    `;

    modal.classList.remove("hidden");

    // Trigger genuine animated progress bar & XP counter increment
    requestAnimationFrame(() => {
      setTimeout(() => {
        const fillEl = document.getElementById("stage-advance-progress-fill");
        if (fillEl) fillEl.style.width = "100%";
      }, 60);
    });

    const xpCounterEl = document.getElementById("stage-advance-xp-counter");
    if (xpCounterEl) {
      let currentVal = 0;
      const step = Math.max(1, Math.floor(earnedXp / 20));
      const interval = setInterval(() => {
        currentVal = Math.min(earnedXp, currentVal + step);
        xpCounterEl.textContent = `+${currentVal} ⚡`;
        if (currentVal >= earnedXp) {
          clearInterval(interval);
        }
      }, 35);
    }
  }

  confirmAdvanceToNextStage(fromStageId) {
    const modal = document.getElementById("stage-advance-modal");
    if (modal) modal.classList.add("hidden");
    this.renderSkillPathMap(fromStageId);
  }

  /* ============================================================================
   * FUNCTIONING DUOLINGO STREAK MODAL
   * ============================================================================ */
  openStreakModal() {
    const modal = document.getElementById("streak-modal");
    const content = document.getElementById("streak-modal-content");
    if (!modal || !content) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const alreadyClaimedToday = this.state.lastStreakClaimDate === todayStr;
    const daysLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const calendarHtml = daysLabels
      .map((day, idx) => {
        const done = this.state.weeklyDaysCompleted[idx];
        return `
          <div class="flex flex-col items-center gap-1.5">
            <span class="text-[11px] font-black text-slate-500">${day}</span>
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${
              done
                ? "bg-amber-400 text-amber-950 border-2 border-amber-500 shadow"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400"
            }">
              ${done ? "✓" : ""}
            </div>
          </div>
        `;
      })
      .join("");

    content.innerHTML = `
      <div class="text-center space-y-5">
        <div class="flex justify-end">
          <button onclick="window.app.closeStreakModal()" class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 font-black text-sm">✕</button>
        </div>

        <div class="text-6xl animate-flame inline-block">🔥</div>
        <div>
          <h2 class="text-3xl font-black text-amber-500">${this.state.streakDays} Day Streak!</h2>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-300 mt-1">
            Practice System Design daily to keep your architecture streak burning!
          </p>
        </div>

        <!-- 7-Day Weekly Streak Calendar -->
        <div class="duo-card p-4 bg-slate-50 dark:bg-slate-900">
          <div class="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            THIS WEEK'S ARCHITECTURE STREAK
          </div>
          <div class="flex justify-between items-center px-2">
            ${calendarHtml}
          </div>
        </div>

        <!-- Streak Freeze Power-Up Card -->
        <div class="duo-card p-4 flex items-center justify-between text-left bg-sky-50/60 dark:bg-sky-950/30 border-sky-300">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🧊</span>
            <div>
              <div class="font-black text-sm text-slate-900 dark:text-white">Streak Freeze Equipped</div>
              <div class="text-xs font-bold text-slate-500 dark:text-slate-400">
                Protects your streak if you miss a day (${this.state.streakFreezes}/2 active)
              </div>
            </div>
          </div>
          <button
            onclick="window.app.buyStreakFreeze()"
            class="duo-btn-blue px-3.5 py-2 text-xs whitespace-nowrap"
          >
            ${this.state.streakFreezes >= 2 ? "MAX EQUIPPED" : "REFILL (50 XP)"}
          </button>
        </div>

        <!-- Interactive Daily Streak Claim Button -->
        <div>
          <button
            onclick="window.app.claimDailyStreakBonus()"
            ${alreadyClaimedToday ? "disabled" : ""}
            class="w-full ${alreadyClaimedToday ? "duo-btn-outline opacity-75" : "duo-btn-gold"} py-3.5 text-sm font-black"
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
    const dayIdx = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
    this.state.weeklyDaysCompleted[dayIdx] = true;

    this.saveState();
    this.openStreakModal(); // Refresh modal
    this.showToast(`🔥 Streak extended to ${this.state.streakDays} days! +50 XP added!`);
  }

  buyStreakFreeze() {
    if (this.state.streakFreezes >= 2) {
      this.showToast("🧊 You already have the maximum 2/2 Streak Freezes equipped!");
      return;
    }
    if (this.state.xp < 50) {
      this.showToast("Not enough XP! Complete a stage to earn 50 XP.");
      return;
    }
    this.state.xp -= 50;
    this.state.streakFreezes = 2;
    this.saveState();
    this.openStreakModal();
    this.showToast("🧊 Streak Freeze refilled to 2/2!");
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

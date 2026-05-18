const CONTENT_FILE = "git-situational-cheat-sheet.md";
const THEME_KEY = "situational-git-theme";

const DANGER_META = {
  SAFE: {
    className: "safe",
    icon: "shield-check",
    label: "SAFE",
    copy: "SAFE — This command only inspects or has very low risk.",
  },
  CAUTION: {
    className: "caution",
    icon: "triangle-alert",
    label: "CAUTION",
    copy: "CAUTION — This changes your repo state. Check what it affects before running.",
  },
  DANGER: {
    className: "danger",
    icon: "octagon-alert",
    label: "DANGER",
    copy: "DANGER — This may discard work or rewrite history. Inspect first.",
  },
  RECOVERY: {
    className: "recovery",
    icon: "lifebuoy",
    label: "RECOVERY",
    copy: "RECOVERY — Useful when something went wrong. Often safer than panic-resetting.",
  },
};

const PANIC_CARDS = [
  {
    title: "First, do not run random commands.",
    description:
      "Before resetting, cleaning, rebasing, or force-pushing, inspect your repo. Git usually gives you a way back, but the safest first move is to understand your current state.",
    danger: "SAFE",
    commands: `git status
git diff
git diff --staged
git log --oneline --graph --decorate --all`,
    whatThisDoes: "Builds a clear map of your current branch, working tree, and recent history.",
    useWhen: "You feel unsure, rushed, or one command away from panic.",
    aiWarning:
      "If you are using an AI coding assistant, ask it to explain why each command is needed before it runs anything destructive.",
  },
  {
    title: "I want to throw away all local changes",
    description:
      "Use this only when you are sure you do not need your local changes. This affects tracked and untracked files differently.",
    danger: "DANGER",
    commands: `git reset --hard
git clean -fd`,
    whatThisDoes:
      "`git reset --hard` discards tracked file changes. `git clean -fd` deletes untracked files and folders.",
    useWhen: "You intentionally want your working tree to match the latest commit.",
    saferFirstStep: "git clean -fdn",
    whatCanGoWrong:
      "You can permanently delete uncommitted work, including files not tracked by Git.",
  },
  {
    title: "I reset something and regret it",
    description: "`reflog` is Git’s emergency history. It can often recover commits or branch states that seem lost.",
    danger: "RECOVERY",
    commands: `git reflog
git reset --hard HEAD@{1}`,
    whatThisDoes: "Finds previous HEAD states, then returns to one of them.",
    useWhen: "A reset, rebase, or branch move made work disappear.",
    avoidWhen: "You are not sure which reflog entry is the right target. Create a rescue branch first.",
    saferFirstStep: "git branch rescue HEAD@{1}",
  },
];

const AI_SAFETY_CARDS = [
  {
    title: "1. Ask for intent",
    description: "Before running a Git command suggested by AI, ask: what problem is this command solving?",
    prompt: `Explain what this Git command does, what files or commits it affects, and whether it can delete work.`,
  },
  {
    title: "2. Ask for a safe preview",
    description: "Many dangerous Git operations have safer inspection steps.",
    commands: `git status
git diff
git clean -fdn
git log --oneline --graph --all`,
  },
  {
    title: "3. Protect shared branches",
    description: "Be extra careful with commands that rewrite history, especially on branches other people use.",
    commands: `git reset --hard
git rebase
git commit --amend
git push --force
git push --force-with-lease`,
    note: "Prefer `git revert` for public/shared history when possible.",
  },
];

const state = {
  categories: [],
  query: "",
  filter: "all",
};

let sectionObserver = null;

const ui = {
  searchInput: document.getElementById("situation-search"),
  filterButtons: Array.from(document.querySelectorAll(".chip")),
  situationsContent: document.getElementById("situations-content"),
  categoryList: document.getElementById("category-list"),
  categoryToggle: document.getElementById("category-toggle"),
  categorySidebar: document.querySelector(".category-sidebar"),
  resultCount: document.getElementById("result-count"),
  panicCards: document.getElementById("panic-cards"),
  aiCards: document.getElementById("ai-cards"),
  themeToggle: document.getElementById("theme-toggle"),
  backToTop: document.getElementById("back-to-top"),
  mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
  mobileNav: document.getElementById("mobile-nav"),
  footerYear: document.getElementById("footer-year"),
};

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFrontMatter(markdown) {
  if (!markdown.startsWith("---")) {
    return markdown;
  }

  const end = markdown.indexOf("\n---", 3);
  if (end < 0) {
    return markdown;
  }

  return markdown.slice(end + 4).trimStart();
}

function stripMarkdown(raw) {
  return String(raw || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTableCells(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function toHeaderKey(raw) {
  const text = stripMarkdown(raw).toLowerCase();
  if (text.includes("situation") || text.includes("goal") || text.includes("mistake")) return "title";
  if (text.includes("command") || text === "use" || text.includes("action")) return "command";
  if (text.includes("danger")) return "danger";
  if (text.includes("notes")) return "notes";
  if (text.includes("meaning")) return "notes";
  return slugify(text);
}

function extractCommands(value) {
  return stripMarkdown(value).replace(/\s*,\s*/g, "\n");
}

function inferDanger(rawDanger, title, commands, notes, categoryName) {
  const raw = String(rawDanger || "");
  const text = `${title} ${commands} ${notes} ${categoryName}`.toLowerCase();

  if (text.match(/\brecover|reflog|rescue|lost work|undo commit safely|revert\b|emergency\b/)) {
    return "RECOVERY";
  }
  if (raw.includes("🔴")) return "DANGER";
  if (raw.includes("🟣")) return "CAUTION";
  if (raw.includes("🟠")) return "CAUTION";
  if (raw.includes("🟡")) return "CAUTION";
  if (raw.includes("🟢")) return "SAFE";
  if (text.match(/reset --hard|clean -fd(?!n)|push --force(?!-with-lease)|filter-repo|delete remote branch/)) {
    return "DANGER";
  }
  if (text.match(/rebase|amend|cherry-pick|stash pop|merge|reset\b|branch -d|pull --rebase/)) {
    return "CAUTION";
  }
  return "SAFE";
}

function inferSaferStep(commands, danger) {
  const c = commands.toLowerCase();
  if (c.includes("git clean -fd") && !c.includes("git clean -fdn")) {
    return "git clean -fdn";
  }
  if (c.includes("git reset --hard")) {
    return `git status
git diff`;
  }
  if (c.includes("git push --force") && !c.includes("--force-with-lease")) {
    return "git push --force-with-lease";
  }
  if (danger === "DANGER") {
    return `git status
git diff`;
  }
  return "";
}

function inferWhatCanGoWrong(commands, danger) {
  const c = commands.toLowerCase();
  if (c.includes("reset --hard")) return "Tracked local changes are discarded and cannot be restored without reflog history.";
  if (c.includes("clean -fdx")) return "Ignored files such as local env files and generated data can be deleted permanently.";
  if (c.includes("clean -fd")) return "Untracked files and folders are deleted permanently.";
  if (c.includes("push --force")) return "Remote history can be rewritten and teammates can lose branch context.";
  if (c.includes("rebase")) return "Commit IDs change, which can confuse collaborators on shared branches.";
  if (danger === "DANGER") return "This command can delete work or rewrite history if run in the wrong context.";
  return "";
}

function inferTags(category, title, commands) {
  const source = `${category} ${title} ${commands}`.toLowerCase();
  const tags = [];
  if (source.includes("branch")) tags.push("branches");
  if (source.match(/\bremote|origin|fetch|pull|push\b/)) tags.push("remotes");
  if (source.match(/\bmerge|conflict|rebase\b/)) tags.push("conflicts");
  if (source.match(/\brecover|reflog|revert|rescue|lost\b/)) tags.push("recovery");
  if (source.match(/\bai|assistant|reset --hard|clean -fd|push --force\b/)) tags.push("ai-safety");
  return [...new Set(tags)];
}

function parseRecipe(lines, startIndex, category) {
  const recipeHeading = lines[startIndex].match(/^##\s+Recipe:\s+["“](.+?)["”]$/);
  const recipeTitle = recipeHeading ? recipeHeading[1].trim() : "Recipe";

  let index = startIndex + 1;
  let commands = "";
  let description = "";
  let useWhen = "";
  let avoidWhen = "";
  const inlineCommands = [];

  while (index < lines.length) {
    const line = lines[index];
    if (/^#\s+\d+\.\s+/.test(line) || /^##\s+Recipe:\s+["“]/.test(line)) {
      break;
    }

    if (line.trim().startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      const block = codeLines.join("\n").trim();
      if (block) {
        commands = commands ? `${commands}\n\n${block}` : block;
      }
      index += 1;
      continue;
    }

    const useMatch = line.match(/^\*\*Use when:\*\*\s*(.+)$/i);
    if (useMatch) {
      useWhen = stripMarkdown(useMatch[1]);
      index += 1;
      continue;
    }

    const warningMatch = line.match(/^\*\*(Warning|Recommendation):\*\*\s*(.+)$/i);
    if (warningMatch) {
      avoidWhen = stripMarkdown(warningMatch[2]);
      index += 1;
      continue;
    }

    const cleaned = stripMarkdown(line);
    const codeMatches = [...line.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
    if (codeMatches.length) {
      inlineCommands.push(...codeMatches);
    }
    if (cleaned && !description) {
      description = cleaned;
    }

    index += 1;
  }

  const danger = inferDanger("", recipeTitle, commands, description, category.name);
  const saferFirstStep = inferSaferStep(commands, danger);
  const fallbackCommands = [...new Set(inlineCommands)].join("\n");

  return {
    nextIndex: index,
    card: {
      id: `recipe-${category.id}-${slugify(recipeTitle)}`,
      category: category.name,
      title: recipeTitle,
      description: description || "Step-by-step recipe for this situation.",
      danger,
      commands: commands || fallbackCommands || "git status",
      whatThisDoes: description || "Runs a focused sequence for this situation.",
      useWhen: useWhen || `You are dealing with: ${recipeTitle}.`,
      avoidWhen: avoidWhen || (danger === "DANGER" ? "Avoid on shared branches unless the impact is fully understood." : ""),
      saferFirstStep,
      whatCanGoWrong: inferWhatCanGoWrong(commands, danger),
      aiWarning:
        danger === "SAFE"
          ? ""
          : "Ask your AI assistant why this command sequence is needed and what data could be lost.",
      tags: inferTags(category.name, recipeTitle, commands),
    },
  };
}

function parseMarkdownContent(markdown) {
  const cleaned = stripFrontMatter(markdown).replaceAll("\r", "");
  const lines = cleaned.split("\n");
  const categories = [];

  let currentCategory = null;
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const sectionMatch = line.match(/^#\s+(\d+)\.\s+(.+)$/);
    if (sectionMatch) {
      const sectionId = Number(sectionMatch[1]);
      if (sectionId <= 25) {
        currentCategory = {
          id: sectionId,
          name: sectionMatch[2].trim(),
          description: "",
          cards: [],
        };
        categories.push(currentCategory);
      } else {
        currentCategory = null;
      }
      lineIndex += 1;
      continue;
    }

    if (!currentCategory) {
      lineIndex += 1;
      continue;
    }

    if (/^##\s+Recipe:\s+["“]/.test(line)) {
      const recipeResult = parseRecipe(lines, lineIndex, currentCategory);
      currentCategory.cards.push(recipeResult.card);
      lineIndex = recipeResult.nextIndex;
      continue;
    }

    if (line.trim().startsWith("|") && lines[lineIndex + 1] && /^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[lineIndex + 1].trim())) {
      const headerCells = parseTableCells(line);
      const headerKeys = headerCells.map(toHeaderKey);
      lineIndex += 2;

      while (lineIndex < lines.length && lines[lineIndex].trim().startsWith("|")) {
        const rowCells = parseTableCells(lines[lineIndex]);
        const row = {};
        headerKeys.forEach((key, idx) => {
          row[key] = rowCells[idx] || "";
        });

        const title = stripMarkdown(row.title || row.situation || row.goal || "");
        const commandValue = extractCommands(row.command || row.use || "");
        const notes = stripMarkdown(row.notes || row.meaning || "");

        if (title && commandValue) {
          const danger = inferDanger(row.danger || "", title, commandValue, notes, currentCategory.name);
          const saferFirstStep = inferSaferStep(commandValue, danger);
          currentCategory.cards.push({
            id: `row-${currentCategory.id}-${slugify(title)}-${currentCategory.cards.length + 1}`,
            category: currentCategory.name,
            title,
            description: notes || `From ${currentCategory.name}.`,
            danger,
            commands: commandValue,
            whatThisDoes: notes || "Applies this command for the stated situation.",
            useWhen: `You are in this exact situation: ${title}.`,
            avoidWhen:
              danger === "DANGER"
                ? "Avoid on shared branches without a backup branch or a clear recovery plan."
                : danger === "CAUTION"
                  ? "Avoid when you are unsure about branch state or collaborator impact."
                  : "",
            saferFirstStep,
            whatCanGoWrong: inferWhatCanGoWrong(commandValue, danger),
            aiWarning:
              danger === "SAFE" ? "" : "Have AI explain scope and blast radius before you run this command.",
            tags: inferTags(currentCategory.name, title, commandValue),
          });
        }

        lineIndex += 1;
      }
      continue;
    }

    const paragraph = stripMarkdown(line);
    if (paragraph && !currentCategory.description && !line.startsWith("---")) {
      currentCategory.description = paragraph;
    }

    lineIndex += 1;
  }

  return categories.map((category) => ({
    ...category,
    cards: category.cards,
  }));
}

function highlightText(text, query) {
  const plain = escapeHtml(text);
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .slice(0, 6);

  if (!tokens.length) return plain;

  const pattern = tokens.map(escapeRegExp).join("|");
  if (!pattern) return plain;

  return plain.replace(new RegExp(`(${pattern})`, "gi"), "<mark>$1</mark>");
}

function highlightCommand(command) {
  return escapeHtml(command)
    .replace(/\b(git)\b/g, '<span class="tok-git">$1</span>')
    .replace(/(--[a-zA-Z0-9-]+)/g, '<span class="tok-flag">$1</span>')
    .replace(/\b(HEAD@\{\d+\}|HEAD~\d+|HEAD)\b/g, '<span class="tok-ref">$1</span>');
}

function createDangerBadge(level) {
  const meta = DANGER_META[level] || DANGER_META.SAFE;
  return `<span class="danger-badge danger-${meta.className}">
    <i data-lucide="${meta.icon}" aria-hidden="true"></i>
    <span>${meta.label}</span>
  </span>`;
}

function buildAiPrompt(commands) {
  return `Explain what this Git command does, what files or commits it affects, and whether it can delete work.\n\nCommand(s):\n${commands}`;
}

function renderCommandBlock(commands, label, copyContext) {
  const copyText = escapeHtml(commands);
  return `<div class="command-block">
    <div class="command-head">
      <span>${escapeHtml(label)}</span>
      <button class="copy-btn" type="button" data-copy="${copyText}" aria-label="Copy ${escapeHtml(copyContext)}">Copy</button>
    </div>
    <pre><code>${highlightCommand(commands)}</code></pre>
  </div>`;
}

function renderSituationCard(card, query) {
  const meta = DANGER_META[card.danger] || DANGER_META.SAFE;
  const saferId = `${card.id}-safer`;
  const showSaferToggle = card.saferFirstStep && card.danger === "DANGER";
  const showInlineSafer = card.saferFirstStep && card.danger !== "DANGER";

  return `<article class="situation-card" id="${escapeHtml(card.id)}">
    <header>
      <h4>${highlightText(card.title, query)}</h4>
      ${createDangerBadge(card.danger)}
    </header>
    <p class="danger-copy">${meta.copy}</p>
    <p>${highlightText(card.description, query)}</p>
    ${renderCommandBlock(card.commands, "Command", `command block for ${card.title}`)}
    <div class="meta-grid">
      <div class="meta-row">
        <h5>What This Does</h5>
        <p>${highlightText(card.whatThisDoes, query)}</p>
      </div>
      <div class="meta-row">
        <h5>Use When</h5>
        <p>${highlightText(card.useWhen, query)}</p>
      </div>
      ${
        card.avoidWhen
          ? `<div class="meta-row">
              <h5>Avoid When</h5>
              <p>${highlightText(card.avoidWhen, query)}</p>
            </div>`
          : ""
      }
      ${
        showInlineSafer
          ? `<div class="meta-row">
              <h5>Safer First Step</h5>
              ${renderCommandBlock(card.saferFirstStep, "Safer first step", `safer first step for ${card.title}`)}
            </div>`
          : ""
      }
    </div>
    ${
      card.whatCanGoWrong
        ? `<details class="details-note">
            <summary>What can go wrong?</summary>
            <p>${highlightText(card.whatCanGoWrong, query)}</p>
          </details>`
        : ""
    }
    ${
      card.aiWarning
        ? `<p class="callout">${highlightText(card.aiWarning, query)}</p>`
        : ""
    }
    <div class="actions-row">
      ${
        showSaferToggle
          ? `<button class="ghost-inline" type="button" data-toggle-target="${escapeHtml(saferId)}" aria-expanded="false">
              <i data-lucide="shield"></i>
              <span>Show safer option</span>
            </button>`
          : ""
      }
      <button
        class="ghost-inline"
        type="button"
        data-copy="${escapeHtml(buildAiPrompt(card.commands))}"
        aria-label="Copy AI explanation prompt for ${escapeHtml(card.title)}"
      >
        <i data-lucide="bot"></i>
        <span>Copy AI prompt</span>
      </button>
    </div>
    ${
      showSaferToggle
        ? `<div class="safer-reveal" id="${escapeHtml(saferId)}">
            ${renderCommandBlock(card.saferFirstStep, "Safer first step", `safer first step for ${card.title}`)}
          </div>`
        : ""
    }
  </article>`;
}

function matchesQuickFilter(card) {
  const filter = state.filter;
  if (filter === "all") return true;
  if (filter === "safe") return card.danger === "SAFE";
  if (filter === "caution") return card.danger === "CAUTION";
  if (filter === "dangerous") return card.danger === "DANGER";
  if (filter === "recovery") return card.danger === "RECOVERY" || card.tags.includes("recovery");
  if (filter === "branches") return card.tags.includes("branches");
  if (filter === "remotes") return card.tags.includes("remotes");
  if (filter === "conflicts") return card.tags.includes("conflicts");
  if (filter === "ai-safety") return card.tags.includes("ai-safety");
  return true;
}

function matchesQuery(card) {
  if (!state.query.trim()) return true;
  const haystack = [
    card.category,
    card.title,
    card.description,
    card.commands,
    card.whatThisDoes,
    card.useWhen,
    card.avoidWhen,
    card.whatCanGoWrong,
    card.aiWarning,
    card.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return state.query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function getFilteredCategories() {
  return state.categories
    .map((category) => ({
      ...category,
      cards: category.cards.filter((card) => matchesQuickFilter(card) && matchesQuery(card)),
    }))
    .filter((category) => category.cards.length > 0);
}

function renderCategorySidebar(filteredCategories) {
  const counts = new Map(filteredCategories.map((category) => [category.id, category.cards.length]));
  ui.categoryList.innerHTML = state.categories
    .map((category) => {
      const id = `category-${category.id}-${slugify(category.name)}`;
      const count = counts.get(category.id) || 0;
      return `<a class="category-link" href="#${id}" data-category-link="${id}">
        <span>${escapeHtml(category.name)}</span>
        <span>${count}</span>
      </a>`;
    })
    .join("");
}

function renderSituations() {
  const filteredCategories = getFilteredCategories();
  renderCategorySidebar(filteredCategories);

  if (!filteredCategories.length) {
    ui.situationsContent.innerHTML = `<div class="no-results">
      No matches for your current search/filter. Try a broader term or switch back to "All".
    </div>`;
    ui.resultCount.textContent = "0 situations";
    refreshIcons();
    return;
  }

  ui.situationsContent.innerHTML = filteredCategories
    .map((category) => {
      const sectionId = `category-${category.id}-${slugify(category.name)}`;
      const description = category.description
        ? `<p class="group-description">${highlightText(category.description, state.query)}</p>`
        : "";
      return `<section class="category-group" id="${sectionId}">
        <h3>${escapeHtml(category.name)}</h3>
        ${description}
        <div class="cards-list">
          ${category.cards.map((card) => renderSituationCard(card, state.query)).join("")}
        </div>
      </section>`;
    })
    .join("");

  const totalCards = filteredCategories.reduce((sum, category) => sum + category.cards.length, 0);
  ui.resultCount.textContent = `${totalCards} situations across ${filteredCategories.length} categories`;

  setupSectionObserver();
  refreshIcons();
}

function renderPanicCards() {
  ui.panicCards.innerHTML = PANIC_CARDS.map((card) => renderSituationCard({ ...card, id: `panic-${slugify(card.title)}`, tags: [] }, "")).join("");
}

function renderAiCards() {
  ui.aiCards.innerHTML = AI_SAFETY_CARDS.map((card) => {
    return `<article class="situation-card">
      <header>
        <h4>${escapeHtml(card.title)}</h4>
        ${createDangerBadge("CAUTION")}
      </header>
      <p>${escapeHtml(card.description)}</p>
      ${
        card.prompt
          ? `<div class="command-block">
              <div class="command-head">
                <span>Suggested prompt</span>
                <button class="copy-btn" type="button" data-copy="${escapeHtml(card.prompt)}" aria-label="Copy suggested AI prompt">
                  Copy
                </button>
              </div>
              <pre><code>${escapeHtml(card.prompt)}</code></pre>
            </div>`
          : ""
      }
      ${
        card.commands
          ? renderCommandBlock(card.commands, "Example commands", `example commands for ${card.title}`)
          : ""
      }
      ${
        card.note
          ? `<p class="callout">${escapeHtml(card.note)}</p>`
          : ""
      }
    </article>`;
  }).join("");
}

function setupSectionObserver() {
  if (sectionObserver) {
    sectionObserver.disconnect();
  }

  const sections = Array.from(document.querySelectorAll(".category-group"));
  if (!sections.length) return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        document.querySelectorAll("[data-category-link]").forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("data-category-link") === id);
        });
      });
    },
    {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

function copyToClipboard(text, sourceButton) {
  const setFeedback = (ok) => {
    const originalHtml = sourceButton.dataset.originalHtml || sourceButton.innerHTML;
    sourceButton.dataset.originalHtml = originalHtml;
    sourceButton.setAttribute("data-copied", ok ? "true" : "false");
    sourceButton.textContent = ok ? "Copied" : "Copy failed";
    window.setTimeout(() => {
      sourceButton.removeAttribute("data-copied");
      sourceButton.innerHTML = sourceButton.dataset.originalHtml || "Copy";
      refreshIcons();
    }, 1500);
  };

  const fallbackCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let successful = false;
    try {
      successful = document.execCommand("copy");
    } catch {
      successful = false;
    }
    document.body.removeChild(textArea);
    setFeedback(successful);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => setFeedback(true))
      .catch(() => fallbackCopy());
    return;
  }

  fallbackCopy();
}

function applyTheme(theme, { persist = true } = {}) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    localStorage.setItem(THEME_KEY, theme);
  }
  const iconName = theme === "dark" ? "sun" : "moon-star";
  const iconElement = ui.themeToggle.querySelector("i");
  iconElement.setAttribute("data-lucide", iconName);
  ui.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  refreshIcons();
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    applyTheme(stored, { persist: false });
    return;
  }
  applyTheme("dark", { persist: false });
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setFooterYear() {
  if (!ui.footerYear) return;
  ui.footerYear.textContent = String(new Date().getFullYear());
}

function setupEvents() {
  ui.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderSituations();
  });

  ui.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter || "all";
      ui.filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderSituations();
    });
  });

  const searchNavLinks = document.querySelectorAll('[data-focus-search="true"]');
  searchNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(() => {
        ui.searchInput.focus();
      }, 160);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/") return;
    const target = event.target;
    const editing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable;
    if (editing) return;
    event.preventDefault();
    ui.searchInput.focus();
  });

  document.addEventListener("click", (event) => {
    const copyTarget = event.target.closest("[data-copy]");
    if (copyTarget) {
      copyToClipboard(copyTarget.getAttribute("data-copy") || "", copyTarget);
      return;
    }

    const toggleTarget = event.target.closest("[data-toggle-target]");
    if (toggleTarget) {
      const targetId = toggleTarget.getAttribute("data-toggle-target");
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl) return;
      const open = targetEl.classList.toggle("is-open");
      toggleTarget.setAttribute("aria-expanded", String(open));
      const label = toggleTarget.querySelector("span");
      if (label) {
        label.textContent = open ? "Hide safer option" : "Show safer option";
      }
      return;
    }
  });

  ui.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  ui.categoryToggle.addEventListener("click", () => {
    ui.categorySidebar.classList.toggle("is-open");
  });

  ui.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (ui.mobileMenuToggle && ui.mobileNav) {
    ui.mobileMenuToggle.addEventListener("click", () => {
      const nextOpen = !ui.mobileNav.classList.contains("is-open");
      ui.mobileNav.classList.toggle("is-open", nextOpen);
      ui.mobileMenuToggle.setAttribute("aria-expanded", String(nextOpen));
      const icon = ui.mobileMenuToggle.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", nextOpen ? "x" : "menu");
      }
      refreshIcons();
    });

    ui.mobileNav.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      ui.mobileNav.classList.remove("is-open");
      ui.mobileMenuToggle.setAttribute("aria-expanded", "false");
      const icon = ui.mobileMenuToggle.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
      }
      refreshIcons();
    });
  }

  window.addEventListener("resize", () => {
    if (!ui.mobileNav || !ui.mobileMenuToggle) return;
    if (window.innerWidth > 920 && ui.mobileNav.classList.contains("is-open")) {
      ui.mobileNav.classList.remove("is-open");
      ui.mobileMenuToggle.setAttribute("aria-expanded", "false");
      const icon = ui.mobileMenuToggle.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
      }
      refreshIcons();
    }
  });

  window.addEventListener("scroll", () => {
    document.body.classList.toggle("show-back-to-top", window.scrollY > 560);
  });
}

async function loadAndRenderSituations() {
  try {
    const response = await fetch(CONTENT_FILE, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${CONTENT_FILE}`);
    }
    const markdown = await response.text();
    state.categories = parseMarkdownContent(markdown);
    renderSituations();
  } catch (error) {
    ui.situationsContent.innerHTML = `<div class="no-results">
      Could not load the Markdown source file. Make sure <code>${escapeHtml(CONTENT_FILE)}</code> is present at the repository root.
    </div>`;
    ui.resultCount.textContent = "Source load failed";
    console.error(error);
  }
}

async function init() {
  initTheme();
  setFooterYear();
  renderPanicCards();
  renderAiCards();
  setupEvents();
  await loadAndRenderSituations();
  refreshIcons();
}

init();

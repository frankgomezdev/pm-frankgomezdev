const VAGUE_PATTERNS = [
  /\bwork on\b/i,
  /\bfix\b/i,
  /\bupdate\b/i,
  /\bmisc\b/i,
  /\btodo\b/i,
  /\bstuff\b/i,
  /\bthings?\b/i,
];

export type GoalQualityAnalysis = {
  isVague: boolean;
  reasons: string[];
  rewriteSuggestion: string | null;
  splitSuggestions: string[];
};

function wordCount(title: string): number {
  return title
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function analyzeGoalTitle(title: string): GoalQualityAnalysis {
  const trimmed = title.trim();
  if (!trimmed) {
    return {
      isVague: false,
      reasons: [],
      rewriteSuggestion: null,
      splitSuggestions: [],
    };
  }

  const reasons: string[] = [];
  const words = wordCount(trimmed);
  if (words < 4) {
    reasons.push("Titles under 4 words are often too vague to act on.");
  }
  for (const pattern of VAGUE_PATTERNS) {
    if (pattern.test(trimmed)) {
      reasons.push(
        "Title uses a vague pattern (e.g. work on / fix / update / misc) — name the outcome or who is helped.",
      );
      break;
    }
  }

  const isVague = reasons.length > 0;
  if (!isVague) {
    return {
      isVague: false,
      reasons: [],
      rewriteSuggestion: null,
      splitSuggestions: [],
    };
  }

  const base = trimmed.replace(/\s+/g, " ");
  let rewriteSuggestion = base;
  if (/\bfix\b/i.test(base)) {
    rewriteSuggestion = `Fix ${base.replace(/\bfix\b/i, "").trim() || "the issue"} so the teammate blocked by it can move forward`;
  } else if (/\bupdate\b/i.test(base)) {
    rewriteSuggestion = `Update ${base.replace(/\bupdate\b/i, "").trim() || "the doc"} with the decision the team needs next`;
  } else if (/\bwork on\b/i.test(base)) {
    rewriteSuggestion = `Ship a concrete step for ${base.replace(/\bwork on\b/i, "").trim() || "this work"} that unblocks the next person`;
  } else if (words < 4) {
    rewriteSuggestion = `${base} — clarify who is helped and what “done” looks like`;
  } else {
    rewriteSuggestion = `${base} toward a named outcome (who/what advances)`;
  }

  // Keep rewrite reasonably short
  if (wordCount(rewriteSuggestion) > 18) {
    rewriteSuggestion = rewriteSuggestion.split(/\s+/).slice(0, 16).join(" ");
  }

  const splitSuggestions = [
    `Clarify scope for “${base}” with the assignee`,
    `Do the smallest visible step on “${base}”`,
    `Share what unblocked (or still blocks) “${base}”`,
  ];

  return {
    isVague: true,
    reasons,
    rewriteSuggestion,
    splitSuggestions,
  };
}

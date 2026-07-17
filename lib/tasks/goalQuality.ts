const ALWAYS_VAGUE_PATTERNS = [
  /\bwork on\b/i,
  /\bmisc\b/i,
  /\btodo\b/i,
  /\bstuff\b/i,
  /\bthings?\b/i,
];

/** Verbs that are fine when they have a concrete object and enough words. */
const WEAK_VERB_PATTERNS = [/\bfix\b/i, /\bupdate\b/i];

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

/**
 * "Fix login validation" has an object after the verb; "Fix it" / "Fix" do not.
 * Require at least two tokens after the verb match to count as an object phrase.
 */
function weakVerbLacksObject(title: string, pattern: RegExp): boolean {
  const match = pattern.exec(title);
  if (!match || match.index == null) return false;
  const after = title.slice(match.index + match[0].length).trim();
  const afterWords = after.split(/\s+/).filter(Boolean);
  return afterWords.length < 2;
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

  const weakVerbWithObject = WEAK_VERB_PATTERNS.some(
    (pattern) => pattern.test(trimmed) && !weakVerbLacksObject(trimmed, pattern),
  );

  // Short titles are often vague, but "Fix login validation" is specific enough.
  if (words < 4 && !weakVerbWithObject) {
    reasons.push("Titles under 4 words are often too vague to act on.");
  }

  for (const pattern of ALWAYS_VAGUE_PATTERNS) {
    if (pattern.test(trimmed)) {
      reasons.push(
        "Title uses a vague pattern (e.g. work on / misc / stuff). Name the outcome or who is helped.",
      );
      break;
    }
  }

  for (const pattern of WEAK_VERB_PATTERNS) {
    if (
      pattern.test(trimmed) &&
      (words < 4 || weakVerbLacksObject(trimmed, pattern)) &&
      !weakVerbWithObject
    ) {
      reasons.push(
        "Title uses fix/update without a clear object. Name what changes and who is unblocked.",
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
  if (/\bfix\b/i.test(base) && (words < 4 || weakVerbLacksObject(base, /\bfix\b/i))) {
    rewriteSuggestion = `Fix ${base.replace(/\bfix\b/i, "").trim() || "the issue"} so the teammate blocked by it can move forward`;
  } else if (
    /\bupdate\b/i.test(base) &&
    (words < 4 || weakVerbLacksObject(base, /\bupdate\b/i))
  ) {
    rewriteSuggestion = `Update ${base.replace(/\bupdate\b/i, "").trim() || "the doc"} with the decision the team needs next`;
  } else if (/\bwork on\b/i.test(base)) {
    rewriteSuggestion = `Ship a concrete step for ${base.replace(/\bwork on\b/i, "").trim() || "this work"} that unblocks the next person`;
  } else if (words < 4) {
    rewriteSuggestion = `${base}: clarify who is helped and what “done” looks like`;
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

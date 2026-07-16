"use client";

import { analyzeGoalTitle } from "@/lib/tasks/goalQuality";

type Props = {
  title: string;
  enabled: boolean;
  onApplyRewrite: (nextTitle: string) => void;
  onApplySplit?: (lines: string[]) => void;
};

export function GoalQualityNudge({
  title,
  enabled,
  onApplyRewrite,
  onApplySplit,
}: Props) {
  if (!enabled) return null;

  const analysis = analyzeGoalTitle(title);
  if (!analysis.isVague) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p className="font-medium">Goal-quality nudge</p>
      <ul className="mt-1 list-inside list-disc text-xs text-amber-900">
        {analysis.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {analysis.rewriteSuggestion && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs text-amber-900">
            Suggested rewrite:{" "}
            <span className="font-medium">{analysis.rewriteSuggestion}</span>
          </p>
          <button
            type="button"
            onClick={() => onApplyRewrite(analysis.rewriteSuggestion!)}
            className="w-fit rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-100"
          >
            Use rewrite
          </button>
        </div>
      )}
      {onApplySplit && analysis.splitSuggestions.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-xs text-amber-900">
            Optional split into smaller steps (informational — not points):
          </p>
          <ul className="list-inside list-decimal text-xs text-amber-900">
            {analysis.splitSuggestions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onApplySplit(analysis.splitSuggestions)}
            className="w-fit rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-100"
          >
            Add split ideas to description
          </button>
        </div>
      )}
    </div>
  );
}

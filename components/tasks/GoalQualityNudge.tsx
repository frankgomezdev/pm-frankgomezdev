"use client";

import { analyzeGoalTitle } from "@/lib/tasks/goalQuality";
import { Button } from "@/components/catalyst/button";
import { Strong, Text } from "@/components/catalyst/text";

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
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm/6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <p className="font-medium">Goal-quality nudge</p>
      <ul className="mt-1 list-inside list-disc text-xs/5 text-amber-900 dark:text-amber-300">
        {analysis.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {analysis.rewriteSuggestion && (
        <div className="mt-2 flex flex-col gap-2">
          <Text className="text-xs/5 text-amber-900 dark:text-amber-300">
            Suggested rewrite: <Strong>{analysis.rewriteSuggestion}</Strong>
          </Text>
          <Button
            type="button"
            outline
            onClick={() => onApplyRewrite(analysis.rewriteSuggestion!)}
            className="w-fit"
          >
            Use rewrite
          </Button>
        </div>
      )}
      {onApplySplit && analysis.splitSuggestions.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <Text className="text-xs/5 text-amber-900 dark:text-amber-300">
            Optional split into smaller steps:
          </Text>
          <ul className="list-inside list-decimal text-xs/5 text-amber-900 dark:text-amber-300">
            {analysis.splitSuggestions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Button
            type="button"
            outline
            onClick={() => onApplySplit(analysis.splitSuggestions)}
            className="w-fit"
          >
            Add split ideas to description
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Composed inline banners (no Catalyst equivalent — approved composition).
 * Used for form-level error/success feedback across screens.
 * Div (not p) so callers may nest links and other phrasing content safely.
 */

type BannerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErrorBanner({ children, className = "" }: BannerProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm/6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 ${className}`}
    >
      {children}
    </div>
  );
}

export function SuccessBanner({ children, className = "" }: BannerProps) {
  return (
    <div
      role="status"
      className={`rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm/6 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 ${className}`}
    >
      {children}
    </div>
  );
}

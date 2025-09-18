import type { HTMLAttributes } from "react";

const dimensionClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
} as const;

const borderClasses = {
  sm: "border-2",
  md: "border-4",
  lg: "border-[6px]",
} as const;

export type LoaderSize = keyof typeof dimensionClasses;

export type LoaderProps = {
  /** Optional text label to describe what is loading. */
  label?: string;
  /** Visual size of the spinner. Defaults to medium. */
  size?: LoaderSize;
  /** Additional class names applied to the outer wrapper. */
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A reusable Tailwind-powered loader spinner used during asynchronous states.
 */
export const Loader = ({
  label = "Loading…",
  size = "md",
  className = "",
  ...props
}: LoaderProps) => {
  const dimensions = dimensionClasses[size];
  const border = borderClasses[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`flex flex-col items-center gap-3 text-slate-500 ${className}`.trim()}
      {...props}
    >
      <div
        className={`animate-spin rounded-full border-indigo-200 border-t-indigo-500 bg-gradient-to-tr from-indigo-400/30 to-transparent ${dimensions} ${border}`.trim()}
      />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  );
};

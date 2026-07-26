export function ProgressBar({
  value,
  label,
  tone = "accent"
}: {
  value: number;
  label: string;
  tone?: "accent" | "water" | "success";
}) {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <span
        className="progress-value"
        data-tone={tone}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

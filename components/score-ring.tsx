import { profileScoreColor } from "@/lib/utils";

export function ScoreRing({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, Math.round(value)));
  const scoreColor = profileScoreColor(normalized);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  return (
    <div
      className="relative size-40 shrink-0"
      role="meter"
      aria-label="Profile score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      aria-valuetext={`${normalized} out of 100`}
    >
      <svg className="size-40 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="54" stroke="#30363d" strokeWidth="8" fill="#161b22" />
        <circle
          cx="64"
          cy="64"
          r="54"
          stroke={scoreColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-semibold leading-none text-[#f0f6fc]">{normalized}</div>
          <div className="mono-type mt-1 text-[10px] uppercase tracking-wider text-[#8b949e]">out of 100</div>
        </div>
      </div>
    </div>
  );
}

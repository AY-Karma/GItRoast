"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import type { ContributionDay, RoastSummary } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

const LEVEL_COLORS = [
  "bg-[#161b22] border-[#21262d]",
  "bg-[#0e4429] border-[#0e4429]",
  "bg-[#006d32] border-[#006d32]",
  "bg-[#26a641] border-[#26a641]",
  "bg-[#39d353] border-[#39d353]"
];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function parseUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getWeeksGrid(contributions: ContributionDay[]) {
  if (!contributions.length) return { weeks: [], monthLabels: [], total: 0 };
  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.reduce((sum, day) => sum + day.count, 0);
  const startDate = parseUtcDate(sorted[0].date);
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());
  const endDate = parseUtcDate(sorted[sorted.length - 1].date);
  endDate.setUTCDate(endDate.getUTCDate() + (6 - endDate.getUTCDay()));
  const dateMap = new Map(sorted.map((day) => [day.date, day]));
  const weeks: Array<Array<ContributionDay | null>> = [];
  const monthLabels: Array<{ label: string; weekIndex: number }> = [];
  let lastMonth = -1;
  const current = new Date(startDate);

  while (current <= endDate) {
    const weekIndex = weeks.length;
    const week: Array<ContributionDay | null> = [];
    for (let day = 0; day < 7; day += 1) {
      const date = current.toISOString().slice(0, 10);
      if (day === 0 && current.getUTCMonth() !== lastMonth) {
        lastMonth = current.getUTCMonth();
        monthLabels.push({ label: current.toLocaleString("en", { month: "short", timeZone: "UTC" }), weekIndex });
      }
      week.push(dateMap.get(date) ?? null);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, monthLabels, total };
}

export function CommitChart({ summary }: { summary: RoastSummary }) {
  const { weeks, monthLabels, total } = useMemo(() => getWeeksGrid(summary.contributions), [summary.contributions]);
  const insight = useMemo(() => {
    if (!weeks.length) return null;
    const counts = weeks.map((week) => week.reduce((sum, day) => sum + (day?.count ?? 0), 0));
    const busiest = Math.max(...counts);
    const zeroDays = summary.contributions.filter((day) => day.count === 0).length;
    return {
      busiest,
      quietRate: Math.round((zeroDays / Math.max(summary.contributions.length, 1)) * 100),
      weeklyAverage: Math.round(total / Math.max(weeks.length, 1))
    };
  }, [summary.contributions, total, weeks]);

  return (
    <section aria-labelledby="contributions-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="contributions-title" className="font-semibold">{compactNumber(total)} contributions in the last year</h2>
        <span className="flex items-center gap-1 text-xs text-[#8b949e]"><CalendarDays className="size-3.5" /> Public profile calendar</span>
      </div>
      <div className="github-box overflow-hidden p-4">
        <div
          className="overflow-x-auto pb-1"
          role="img"
          aria-label={insight ? `${total} public contribution signals. The busiest week had ${insight.busiest}; ${insight.quietRate} percent of visible days had no contributions.` : "No public contribution calendar available."}
        >
          {weeks.length ? (
            <div className="min-w-max">
              <div className="relative h-4 pl-[32px]">
                {monthLabels.map((month) => (
                  <span key={`${month.label}-${month.weekIndex}`} className="absolute text-[10px] text-[#8b949e]" style={{ left: `${32 + month.weekIndex * 14}px` }}>{month.label}</span>
                ))}
              </div>
              <div className="mt-1 flex gap-[3px]">
                <div className="mr-1 flex flex-col gap-[3px]">
                  {DAY_LABELS.map((label, index) => <div key={index} className="flex h-[11px] w-7 items-center text-[9px] text-[#8b949e]">{label}</div>)}
                </div>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <span
                        key={day?.date ?? `${weekIndex}-${dayIndex}`}
                        className={`size-[11px] rounded-[2px] border ${day ? LEVEL_COLORS[Math.max(0, Math.min(4, day.level))] : LEVEL_COLORS[0]}`}
                        title={day ? `${day.count} contributions on ${day.date}` : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-[#8b949e]">
                <span className="mr-1">Less</span>
                {LEVEL_COLORS.map((color, index) => <span key={index} className={`size-[10px] rounded-[2px] border ${color}`} />)}
                <span className="ml-1">More</span>
              </div>
            </div>
          ) : (
            <div className="grid h-24 place-items-center text-sm text-[#8b949e]">No public contribution data available</div>
          )}
        </div>
        {insight ? (
          <div className="mt-4 grid gap-3 border-t border-[#21262d] pt-4 text-xs text-[#8b949e] sm:grid-cols-3">
            <span><strong className="block text-sm text-[#c9d1d9]">{insight.weeklyAverage}</strong> average per week</span>
            <span><strong className="block text-sm text-[#c9d1d9]">{insight.busiest}</strong> busiest visible week</span>
            <span><strong className="block text-sm text-[#c9d1d9]">{insight.quietRate}%</strong> quiet visible days</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

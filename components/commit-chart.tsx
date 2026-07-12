"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { RoastSummary } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

const LEVEL_COLORS = [
  "bg-[#161b22]",
  "bg-[#0e4429]",
  "bg-[#006d32]",
  "bg-[#26a641]",
  "bg-[#39d353]"
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getWeeksGrid(contributions: Array<{ date: string; count: number; level: number }>) {
  if (!contributions.length) return { weeks: [], monthLabels: [], total: 0 };

  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.reduce((sum, d) => sum + d.count, 0);

  const firstDate = new Date(sorted[0].date + "T00:00:00");
  const lastDate = new Date(sorted[sorted.length - 1].date + "T00:00:00");

  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDate);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const dateMap = new Map(sorted.map((d) => [d.date, d]));

  const weeks: Array<Array<{ date: string; count: number; level: number } | null>> = [];
  const monthLabels: Array<{ label: string; weekIndex: number }> = [];
  let lastMonth = -1;

  const current = new Date(startDate);
  let weekIndex = 0;

  while (current <= endDate) {
    const week: Array<{ date: string; count: number; level: number } | null> = [];

    for (let day = 0; day < 7; day++) {
      const dateStr = current.toISOString().split("T")[0];
      const dayData = dateMap.get(dateStr) ?? null;

      if (day === 0) {
        const month = current.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            label: current.toLocaleString("en", { month: "short" }),
            weekIndex
          });
          lastMonth = month;
        }
      }

      week.push(dayData);
      current.setDate(current.getDate() + 1);
    }

    weeks.push(week);
    weekIndex++;
  }

  return { weeks, monthLabels, total };
}

export function CommitChart({ summary }: { summary: RoastSummary }) {
  const { weeks, monthLabels, total } = useMemo(
    () => getWeeksGrid(summary.contributions),
    [summary.contributions]
  );

  const hasData = weeks.length > 0;

  const roasts = useMemo(() => {
    if (!hasData) return [];

    const weekCounts = weeks.map((w, i) => ({
      count: w.reduce((s, d) => s + (d?.count ?? 0), 0),
      label: monthLabels.find((m) => m.weekIndex === i)?.label ?? `W${i + 1}`
    }));

    const busiest = weekCounts.reduce((a, b) => (a.count > b.count ? a : b));
    const quietest = weekCounts.reduce((a, b) => (a.count < b.count ? a : b));
    const zeroDays = summary.contributions.filter((d) => d.count === 0).length;
    const gapRate = Math.round((zeroDays / Math.max(summary.contributions.length, 1)) * 100);
    const avgPerWeek = Math.round(total / Math.max(weekCounts.length, 1));

    return [
      `${busiest.count > 0 ? busiest.label + " had " + busiest.count + " commits — a brief flurry of competence." : "Every week looks like a ghost town. Did you forget your GitHub password?"}`,
      `${gapRate > 70 ? gapRate + "% of days are empty. That's not a schedule, that's a pattern of abandonment." : "A solid " + avgPerWeek + " commits per week. Consistency is your middle name."}`,
      `${total < 100 ? total + " total commits. That's rookie numbers. You gotta pump those up." : quietest.count < 5 ? quietest.label + " had " + quietest.count + " commits. Were you on vacation? A very long, unproductive vacation." : "Somehow " + busiest.label + " was your peak. The bar was on the floor."}`
    ];
  }, [weeks, monthLabels, total, hasData, summary.contributions]);

  return (
    <Card className="flex h-full flex-col gap-5 p-6 sm:p-7">
      <h3 className="text-2xl font-bold tracking-tight break-words">
        {compactNumber(total)} contributions in the last year
      </h3>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1117] p-4">
        {hasData ? (
          <div>
            {/* The day-label column is 28px wide + 2px padding = 30px offset before the
                grid starts. Each cell is 11px + 3px gap = 14px per week column.
                Month label `left` must be offset by the full day-label width so the text
                aligns with the week columns, not with the container edge. */}
            <div className="relative h-4 pl-[30px]">
                {monthLabels.map((month) => (
                  <span
                    key={`${month.label}-${month.weekIndex}`}
                    className="absolute text-[10px] text-[#8b949e]"
                    style={{ left: `calc(30px + ${month.weekIndex * 14}px)` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>

            <div className="mt-1 flex gap-[3px]">
              <div className="flex flex-col gap-[3px] pr-[2px]">
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="flex h-[11px] w-[28px] items-center text-[10px] text-[#8b949e]">
                    {label}
                  </div>
                ))}
              </div>

              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`h-[11px] w-[11px] rounded-[2px] ${
                        day ? LEVEL_COLORS[day.level] : "bg-[#161b22]"
                      }`}
                      title={day ? `${day.count} contributions on ${day.date}` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-[#8b949e]">
              <span>Less</span>
              {LEVEL_COLORS.map((color, i) => (
                <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-[#8b949e]">
            No contribution data available
          </div>
        )}
      </div>

      {hasData && roasts.length > 0 ? (
        <div className="space-y-2">
          {roasts.map((line, i) => (
            <p key={i} className="text-sm leading-6 text-zinc-400">{line}</p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

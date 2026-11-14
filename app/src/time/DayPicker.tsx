import clsx from "clsx";
import { useApp } from "../state/store";

/** One button per day in the data. The two dev days have labels; the eval day is the one that was submitted. */
export function DayPicker() {
  const days = useApp((s) => s.index?.days ?? []);
  const current = useApp((s) => s.day?.date);
  const setDay = useApp((s) => s.setDay);

  return (
    <div className="flex gap-1 rounded-lg bg-panel-raised p-1">
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => void setDay(day.date)}
          aria-pressed={day.date === current}
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
            day.date === current ? "bg-accent/25 text-ink ring-1 ring-accent" : "text-muted hover:text-ink",
          )}
        >
          {day.label}
          <span className="text-[11px] font-normal text-faint">{day.kind}</span>
        </button>
      ))}
    </div>
  );
}

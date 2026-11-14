import clsx from "clsx";
import { useApp } from "../state/store";

/** One button per day in the data. The two dev days have labels; the eval day is the one that was submitted. */
export function DayPicker() {
  const days = useApp((s) => s.index?.days ?? []);
  const current = useApp((s) => s.day?.date);
  const setDay = useApp((s) => s.setDay);

  return (
    <div className="flex gap-2">
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => void setDay(day.date)}
          aria-pressed={day.date === current}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors",
            day.date === current
              ? "bg-accent/20 text-ink ring-1 ring-accent"
              : "bg-panel-raised text-muted hover:text-ink",
          )}
        >
          {day.label}
          <span className="rounded bg-line px-1 py-px text-[10px] font-medium leading-tight text-muted">{day.kind}</span>
        </button>
      ))}
    </div>
  );
}

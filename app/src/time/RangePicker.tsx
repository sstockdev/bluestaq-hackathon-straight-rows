import { DAY_SECONDS } from "../lib/time";
import { useApp } from "../state/store";
import { Slider } from "../ui/Slider";

/** The slider moves in 15-minute steps, and the range is never narrower than one step. */
const STEP = 900;
const TICKS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

/**
 * The two-handle slider for the stretch of the day to look at. The map's
 * hexagons never look outside this range, and the time bar zooms to it.
 */
export function RangePicker() {
  const midnight = useApp((s) => s.day?.t0 ?? 0);
  const range = useApp((s) => s.range);
  const setRange = useApp((s) => s.setRange);
  const wholeDay = range[0] === midnight && range[1] === midnight + DAY_SECONDS;

  const onChange = ([from, to]: number[]) => {
    if (to - from >= STEP) setRange([midnight + from, midnight + to]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted">Range</span>
        <button
          onClick={() => setRange([midnight, midnight + DAY_SECONDS])}
          disabled={wholeDay}
          className="rounded text-accent hover:underline disabled:text-faint disabled:no-underline"
        >
          Whole day
        </button>
      </div>
      <Slider
        label="Range of the day"
        value={[range[0] - midnight, range[1] - midnight]}
        min={0}
        max={DAY_SECONDS}
        step={STEP}
        onChange={onChange}
      />
      {/* Each label is 32 px wide and the row overhangs by 8 px, which centers the labels on the handle stops. */}
      <div className="tabular -mx-2 mt-1 flex justify-between text-[11px] text-faint">
        {TICKS.map((tick) => (
          <span key={tick} className="w-8 text-center">{tick}</span>
        ))}
      </div>
    </div>
  );
}

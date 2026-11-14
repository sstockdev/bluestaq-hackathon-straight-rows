import * as RadixSlider from "@radix-ui/react-slider";

/** A slider with one handle per value. Two values make a range. */
export function Slider({
  value, min, max, step = 1, onChange, label,
}: {
  value: number[];
  min: number;
  max: number;
  step?: number;
  onChange: (value: number[]) => void;
  label: string;
}) {
  return (
    <RadixSlider.Root
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onChange}
      aria-label={label}
      className="relative flex h-5 w-full touch-none select-none items-center"
    >
      <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-line">
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RadixSlider.Track>
      {value.map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          aria-label={value.length === 2 ? `${label}, ${i === 0 ? "start" : "end"}` : label}
          className="block h-4 w-4 cursor-grab rounded-full border-2 border-accent bg-page"
        />
      ))}
    </RadixSlider.Root>
  );
}

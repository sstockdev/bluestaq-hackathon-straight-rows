import * as RadixSwitch from "@radix-ui/react-switch";

/** An on/off switch. `label` names it for screen readers. */
export function Switch({
  checked, onChange, label, disabled = false,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-line transition-colors disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-accent"
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-ink transition-transform data-[state=checked]:translate-x-[18px]" />
    </RadixSwitch.Root>
  );
}

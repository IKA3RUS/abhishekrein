import {
  type RegisterableHotkey,
  formatForDisplay,
  useHotkey,
} from "@tanstack/react-hotkeys";

import { Kbd, KbdGroup } from "@/components/primitives/Kbd";

const noop = () => {};

function Hotkey({
  keys,
  onActivate,
  ...props
}: {
  keys: string;
  onActivate?: () => void;
} & React.ComponentProps<typeof KbdGroup>) {
  useHotkey(keys as RegisterableHotkey, onActivate ?? noop);

  return (
    <KbdGroup {...props}>
      {[...formatForDisplay(keys)]
        .filter((char) => char.trim())
        .map((char, i) => (
          <Kbd key={i}>{char}</Kbd>
        ))}
    </KbdGroup>
  );
}

export { Hotkey };

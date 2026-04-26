import { formatForDisplay } from "@tanstack/react-hotkeys";

import { Kbd, KbdGroup } from "@/components/primitives/Kbd";

function Hotkey({
  keys,
  ...props
}: { keys: string } & React.ComponentProps<typeof KbdGroup>) {
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

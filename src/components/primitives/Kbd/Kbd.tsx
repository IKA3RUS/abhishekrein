import { InfoChip } from "@/components/primitives/InfoChip/InfoChip";

import { cn } from "@/lib/cn";

function Kbd({ className, children, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd data-slot="kbd" className="contents" {...props}>
      <InfoChip
        className={cn("pointer-events-none justify-center px-1", className)}
      >
        {children}
      </InfoChip>
    </kbd>
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn(
        "hidden items-center gap-1 sm:pointer-fine:inline-flex",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };

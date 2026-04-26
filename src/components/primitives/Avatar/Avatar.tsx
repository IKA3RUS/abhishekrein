import { type ReactNode, createContext, useContext, useRef } from "react";

import { cn } from "@/lib/cn";

type AvatarContextValue = {
  fallbackRef: React.RefObject<HTMLSpanElement | null>;
};

const AvatarContext = createContext<AvatarContextValue>({
  fallbackRef: { current: null },
});

function Avatar({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const fallbackRef = useRef<HTMLSpanElement>(null);

  return (
    <AvatarContext value={{ fallbackRef }}>
      <span
        className={cn(
          "relative flex min-h-6 min-w-6 shrink-0 items-center justify-center overflow-hidden rounded-full",
          className,
        )}
      >
        {children}
      </span>
    </AvatarContext>
  );
}

function AvatarImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { fallbackRef } = useContext(AvatarContext);

  return (
    <img
      src={src}
      alt={alt}
      className={cn("absolute inset-0 size-full object-cover", className)}
      onError={(e) => {
        e.currentTarget.style.display = "none";
        if (fallbackRef.current) fallbackRef.current.style.display = "flex";
      }}
    />
  );
}

function AvatarFallback({
  color,
  children,
  className,
}: {
  color?: string;
  children: ReactNode;
  className?: string;
}) {
  const { fallbackRef } = useContext(AvatarContext);

  return (
    <span
      ref={fallbackRef}
      className={cn("size-full items-center justify-center", className)}
      style={{ display: "none", backgroundColor: color }}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarFallback, AvatarImage };

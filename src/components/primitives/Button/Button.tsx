import { type HTMLAttributes, createContext, useCallback, useContext, useRef } from "react";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";

import { Hotkey } from "@/components/composites/Hotkey";

import { cn } from "@/lib/cn";

type ButtonContextValue = { trigger: () => void; disabled: boolean };
const ButtonContext = createContext<ButtonContextValue>({
  trigger: () => {},
  disabled: false,
});

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap uppercase outline-none select-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-yellow-4 text-neutral-11 *:data-[slot=label]:group-active/button:text-yellow-4 **:data-[slot=sweep]:border-yellow-6 **:data-[slot=sweep]:bg-neutral-11 group-active/button:**:data-[slot=sweep]:border-neutral-7 *:data-[slot=trailing-icon]:bg-violet-7 [&_[data-slot=leading-icon]_svg]:fill-violet-7 [&_[data-slot=trailing-icon]_svg]:fill-white [&_svg]:group-active/button:fill-yellow-4 [&_svg]:group-active/button:text-yellow-4 [&_svg]:group-active/button:transition-[fill]",
        secondary:
          "bg-neutral-2 text-neutral-11 *:data-[slot=label]:group-active/button:text-white **:data-[slot=sweep]:border-yellow-6 **:data-[slot=sweep]:bg-neutral-11 group-active/button:**:data-[slot=sweep]:border-neutral-7 *:data-[slot=trailing-icon]:bg-violet-7 [&_[data-slot=leading-icon]_svg]:fill-violet-7 [&_[data-slot=trailing-icon]_svg]:fill-white [&_svg]:group-active/button:fill-yellow-4 [&_svg]:group-active/button:text-yellow-4 [&_svg]:group-active/button:transition-[fill] [&:disabled_[data-slot=label]]:text-neutral-4 [&:disabled_[data-slot=leading-icon]_svg]:fill-neutral-4 [&:disabled_[data-slot=trailing-icon]]:bg-neutral-3 [&:disabled_[data-slot=trailing-icon]_svg]:fill-neutral-4",
      },
      size: {
        regular:
          "h-17 min-w-17 gap-2 px-8 py-1 typography-label-2 *:data-[slot=label]:mr-12 *:data-[slot=trailing-icon]:-mx-7",
        small:
          "h-10 min-w-10 gap-2 px-3 py-1 typography-label-3 *:data-[slot=trailing-icon]:-mx-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "regular",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "regular",
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const ref = useRef<HTMLButtonElement>(null);
  const trigger = useCallback(() => ref.current?.click(), []);

  return (
    <ButtonContext.Provider value={{ trigger, disabled: !!disabled }}>
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            data-slot="sweep"
            className="absolute inset-0 size-full translate-y-full transition-[translate] duration-100 ease-in-out group-active/button:translate-y-0"
          />
        </div>
      </ButtonPrimitive>
    </ButtonContext.Provider>
  );
}

function ButtonLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="label"
      className={cn(
        "z-1 inline-flex w-full items-center group-hover/button:animate-vibrate group-active/button:animate-vibrate group-active/button:animation-duration-[0.05s] group-active/button:[--vibrate-amplitude:2px] group-disabled/button:animate-none",
        className,
      )}
      {...props}
    />
  );
}

function ButtonLeadingIcon({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="leading-icon"
      className={cn("z-1", className)}
      {...props}
    />
  );
}

function ButtonHotkey({
  className,
  ...props
}: React.ComponentProps<typeof Hotkey>) {
  const { trigger, disabled } = useContext(ButtonContext);
  return (
    <Hotkey
      onActivate={disabled ? undefined : trigger}
      className={cn("absolute right-0 -bottom-8", className)}
      {...props}
    />
  );
}

function ButtonTrailingIcon({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="trailing-icon"
      className={cn(
        "z-1 inline-flex aspect-square h-full items-center justify-center",
        className,
      )}
      {...props}
    >
      <span className="flex size-full items-center justify-center overflow-hidden *:group-hover/button:animate-marquee-x *:group-active/button:animate-marquee-x *:group-active/button:animation-duration-[0.5s] *:group-disabled/button:animate-none">
        {children}
      </span>
    </span>
  );
}

export {
  Button,
  ButtonHotkey,
  ButtonLeadingIcon,
  ButtonLabel,
  ButtonTrailingIcon,
  buttonVariants,
};

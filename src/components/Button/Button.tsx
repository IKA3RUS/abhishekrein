"use client";

import { type HTMLAttributes } from "react";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap uppercase outline-none select-none *:data-[slot=label]:flex *:data-[slot=label]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-yellow-4 typography-label-2 text-neutral-11 *:data-[slot=label]:group-active/button:text-yellow-4 *:data-[slot=sweep]:border-yellow-6 *:data-[slot=sweep]:bg-neutral-11 *:data-[slot=sweep]:group-active/button:border-neutral-7 *:data-[slot=trailing-icon]:bg-violet-7 [&_[data-slot=leading-icon]_svg]:fill-violet-7 [&_[data-slot=trailing-icon]_svg]:fill-white [&_svg]:group-active/button:fill-yellow-4 [&_svg]:group-active/button:text-yellow-4 [&_svg]:group-active/button:transition-[fill]",
      },
      size: {
        default:
          "h-17 gap-2 p-1 px-8 has-data-[slot=trailing-icon]:pr-1 *:data-[slot=trailing-icon]:ml-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <div
        data-slot="sweep"
        className="absolute inset-0 size-full translate-x-[0.25px] translate-y-[calc(100%-2px)] border-t-2 transition-[translate] duration-100 ease-in-out group-active/button:translate-y-0"
      />
      {children}
    </ButtonPrimitive>
  );
}

function ButtonLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="label"
      className={cn(
        "z-1 w-full group-hover/button:animate-vibrate group-active/button:animate-vibrate group-active/button:[--vibrate-amplitude:2px] group-active/button:[animation-duration:0.05s]",
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

function ButtonTrailingIcon({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="trailing-icon"
      className={cn(
        "z-1 flex aspect-square h-full items-center justify-center",
        className,
      )}
      {...props}
    >
      <span className="flex size-full items-center justify-center overflow-hidden *:group-active/button:animate-marquee-x *:group-active/button:[animation-duration:0.5s]">
        {children}
      </span>
    </span>
  );
}

export {
  Button,
  ButtonLeadingIcon,
  ButtonLabel,
  ButtonTrailingIcon,
  buttonVariants,
};

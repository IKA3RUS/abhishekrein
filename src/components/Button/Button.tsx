"use client";

import { useState } from "react";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer overflow-hidden whitespace-nowrap uppercase outline-none select-none *:data-[slot=label]:flex *:data-[slot=label]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "[a]:hover:bg-primary/80 bg-yellow-4 typography-label-2 text-neutral-11 *:data-[slot=label]:group-hover/button:text-yellow-4 *:data-[slot=label]:group-data-[tap=true]/button:text-yellow-4 *:data-[slot=sweep]:border-yellow-6 *:data-[slot=sweep]:bg-neutral-11 [&_svg]:fill-violet-7 [&_svg]:group-hover/button:fill-yellow-4 [&_svg]:group-hover/button:text-yellow-4 [&_svg]:group-hover/button:transition-[fill]",
      },
      size: {
        default:
          "h-17 *:data-[slot=label]:gap-3 *:data-[slot=label]:px-6 *:data-[slot=label]:*:data-[icon=inline-end]:ml-auto",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const [touch, setTouch] = useState(false);

  const handleTouchStart = () => {
    setTouch(true);
  };
  const handleTouchEnd = () => {
    setTimeout(() => setTouch(false), 300);
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      data-tap={touch}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      <div
        data-slot="sweep"
        className="absolute inset-0 size-full translate-x-[0.25px] translate-y-[calc(100%-2px)] border-t-2 transition-[translate] duration-100 ease-in-out group-hover/button:translate-y-0 group-data-[tap=true]/button:translate-y-0"
      />
      <span
        data-slot="label"
        className="z-1 w-full text-left transition-[color,font-weight] duration-100 ease-in-out"
      >
        {props.children}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };

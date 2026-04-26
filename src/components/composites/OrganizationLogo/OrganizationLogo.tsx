import { kebabCase } from "change-case";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/Avatar";

import { cn } from "@/lib/cn";

import CorporateFareIcon from "@material-symbols/svg-700/sharp/corporate_fare-fill.svg?react";

const ORGANIZATION_LOGOS_BASE_PATH = "/images/common/logos/";

function OrganizationLogo({
  organization,
  color,
  className,
  ...props
}: {
  organization: string;
  color: string;
  className?: string;
}) {
  return (
    <Avatar
      className={cn("h-6 min-h-6 w-auto min-w-6 rounded-none", className)}
      {...props}
    >
      <AvatarImage
        src={`${ORGANIZATION_LOGOS_BASE_PATH}${kebabCase(organization)}-logo.png`}
        alt={`${organization} logo`}
        className="static object-contain"
      />
      <AvatarFallback color={color}>
        <CorporateFareIcon className="size-4 fill-white" />
      </AvatarFallback>
    </Avatar>
  );
}

export { OrganizationLogo };

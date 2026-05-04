import { cn } from "@/lib/cn";
import type { Member } from "@/lib/schemas/member";

import GlobeIcon from "@material-symbols/svg-700/sharp/globe-fill.svg?react";
import PlayArrowIcon from "@material-symbols/svg-700/sharp/play_arrow-fill.svg?react";

import BehanceLogo from "@/assets/common/logos/behance-logo.svg?react";
import GithubLogo from "@/assets/common/logos/github-logo.svg?react";
import LinkedinLogo from "@/assets/common/logos/linkedin-logo.svg?react";
import XLogo from "@/assets/common/logos/x-logo.svg?react";

function jenkins(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h += str.charCodeAt(i);
    h += h << 10;
    h ^= h >>> 6;
  }
  h += h << 3;
  h ^= h >>> 11;
  h += h << 15;
  return h >>> 0;
}

function nameToColor(name: string): {
  backgroundColor: string;
  textColor: string;
} {
  if (name === "Abhishek Rein") {
    return {
      backgroundColor: "var(--color-violet-6)",
      textColor: "var(--color-violet-4)",
    };
  }

  const hash = jenkins(name);

  const hue = hash % 360;
  const saturation = 100;
  const backgroundLightness = 48;
  const textLightness = 70;

  return {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${backgroundLightness}%)`,
    textColor: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
  };
}

interface MemberChipProps {
  member: Member;
  color?: string;
  className?: string;
}

export function MemberChip({ member, color, className }: MemberChipProps) {
  const backgroundColor = color ?? nameToColor(member.name).backgroundColor;
  const textColor = color ?? nameToColor(member.name).textColor;

  return (
    <div className={cn("inline-flex items-start select-none", className)}>
      <PlayArrowIcon
        className="size-5 rotate-230"
        style={{ fill: backgroundColor }}
      />
      <div
        className="mt-4 -ml-1 flex items-center gap-1 bg-neutral-11 px-2 py-1 typography-text-3 whitespace-nowrap text-white ring-1 ring-neutral-9"
        style={{ color }}
      >
        <span className="lowercase" style={{ color: textColor }}>
          {member.name}
        </span>
        {(member.websiteUrl ||
          member.xUrl ||
          member.githubUrl ||
          member.linkedinUrl) && (
          <div className="flex translate-x-1 items-center gap-1 bg-neutral-8 p-1 [&_svg]:fill-white">
            {member.websiteUrl && (
              <a
                href={member.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlobeIcon className="size-3.5" />
              </a>
            )}
            {member.xUrl && (
              <a href={member.xUrl} target="_blank" rel="noopener noreferrer">
                <XLogo className="size-4" />
              </a>
            )}
            {member.githubUrl && (
              <a
                href={member.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubLogo className="size-4" />
              </a>
            )}
            {member.linkedinUrl && (
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinLogo className="size-4" />
              </a>
            )}
            {member.behanceUrl && (
              <a
                href={member.behanceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BehanceLogo className="size-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

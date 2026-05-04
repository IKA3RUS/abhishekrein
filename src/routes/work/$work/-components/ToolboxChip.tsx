import { kebabCase } from "change-case";
import type { Work } from "content-collections";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/primitives/Avatar";

import {
  RevealChip,
  RevealChipContent,
  RevealChipIcon,
  RevealChipLabel,
  RevealChipSummary,
  RevealChipTrigger,
} from "@/components/composites/RevealChip";

import BuildIcon from "@material-symbols/svg-700/sharp/build-fill.svg?react";
import SwordRoseIcon from "@material-symbols/svg-700/sharp/sword_rose-fill.svg?react";

const TOOL_LOGOS_BASE_PATH = "/images/common/logos/";

function ToolboxChip({
  toolbox,
  color,
}: {
  toolbox: Work["toolbox"];
  color: string;
}) {
  return (
    <RevealChip>
      <RevealChipTrigger>
        <RevealChipIcon>
          <SwordRoseIcon />
        </RevealChipIcon>
        <RevealChipLabel>Toolbox</RevealChipLabel>
        <RevealChipSummary>{toolbox.length}</RevealChipSummary>
      </RevealChipTrigger>
      <RevealChipContent className="w-fit gap-5">
        <h1 className="typography-text-3 font-bold">toolbox</h1>
        <div className="flex flex-col gap-2">
          {toolbox.map((tool, index) => {
            return (
              <div key={index} className="flex gap-2">
                <Avatar className="size-5 min-h-5 min-w-5 rounded-none">
                  <AvatarImage
                    src={`${TOOL_LOGOS_BASE_PATH}${kebabCase(tool)}-logo.png`}
                    alt={`${tool} logo`}
                    className="object-contain"
                  />
                  <AvatarFallback color={color}>
                    <BuildIcon className="size-3 fill-white" />
                  </AvatarFallback>
                </Avatar>
                <span>{tool}</span>
              </div>
            );
          })}
        </div>
      </RevealChipContent>
    </RevealChip>
  );
}

export { ToolboxChip };

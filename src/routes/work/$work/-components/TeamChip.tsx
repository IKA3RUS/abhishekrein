import { useMemo } from "react";

import type { Work } from "content-collections";

import {
  RevealChip,
  RevealChipContent,
  RevealChipIcon,
  RevealChipLabel,
  RevealChipSummary,
  RevealChipTrigger,
} from "@/components/composites/RevealChip";

import { CursorSway } from "@/components/effects/CursorSway";

import { MemberChip } from "./MemberChip";

import CloseSmallIcon from "@material-symbols/svg-700/sharp/close_small-fill.svg?react";
import Groups3Icon from "@material-symbols/svg-700/sharp/groups_3-fill.svg?react";

function TeamChip({ team, color }: { team: Work["team"]; color: string }) {
  const offsets = useMemo(
    () => team.map((role) => role.members.map(() => Math.random() * 64)),
    [],
  );

  return (
    <RevealChip>
      <RevealChipTrigger>
        <RevealChipIcon>
          <Groups3Icon />
        </RevealChipIcon>
        <RevealChipLabel>Team</RevealChipLabel>
        <RevealChipSummary>
          <span>{team[0]?.members.length}</span>
          <CloseSmallIcon aria-hidden style={{ fill: color }} />
          <span>{team[0]?.role}</span>
        </RevealChipSummary>
      </RevealChipTrigger>

      <RevealChipContent className="gap-5">
        <h1 className="typography-text-3 font-bold">team</h1>
        {team.map((role, roleIndex) => (
          <div key={roleIndex} className="flex flex-col gap-3">
            <p className="flex items-center typography-text-3 text-neutral-11">
              <span className="typography-text-3 font-light">
                {role.members.length}
              </span>
              <CloseSmallIcon
                aria-hidden
                className="relative top-px size-4"
                style={{ fill: color }}
              />
              <span className="font-bold">{role.role}</span>
            </p>

            <ul className="flex flex-col gap-2">
              {role.members.map((member, memberIndex) => (
                <li
                  key={memberIndex}
                  className="group flex items-center"
                  style={{ marginLeft: offsets[roleIndex]?.[memberIndex] }}
                >
                  <CursorSway>
                    <MemberChip member={member} />
                  </CursorSway>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </RevealChipContent>
    </RevealChip>
  );
}

export { TeamChip };

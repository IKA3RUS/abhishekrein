import {
  InfoChip,
  InfoChipLeadingIcon,
} from "@/components/primitives/InfoChip";

import TimerIcon from "@material-symbols/svg-700/sharp/timer-fill.svg?react";

function ReadingMinutesChip({ minutes }: { minutes: number }) {
  return (
    <InfoChip>
      <InfoChipLeadingIcon>
        <TimerIcon />
      </InfoChipLeadingIcon>
      {minutes} MINS
    </InfoChip>
  );
}

export { ReadingMinutesChip };

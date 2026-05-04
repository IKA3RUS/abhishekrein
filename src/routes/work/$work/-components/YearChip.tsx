import {
  InfoChip,
  InfoChipLeadingIcon,
} from "@/components/primitives/InfoChip";

import CalendarTodayIcon from "@material-symbols/svg-700/sharp/calendar_today-fill.svg?react";

function YearChip({ year }: { year: number }) {
  return (
    <InfoChip>
      <InfoChipLeadingIcon>
        <CalendarTodayIcon />
      </InfoChipLeadingIcon>
      {year}
    </InfoChip>
  );
}

export { YearChip };

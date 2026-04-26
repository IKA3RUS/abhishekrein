import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

export function calculateReadingMinutes(mdast: any): number {
  return Math.round(getReadingTime(toString(mdast)).minutes);
}

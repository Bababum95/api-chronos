import { Activity } from './activity.type';

export type SummariesRangeResponse = {
  totalTime: number;
  totalTimeStr: string;
  start: number;
  end: number;
  activities?: Activity[][];
};

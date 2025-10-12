import { Types } from 'mongoose';

export type Activity = {
  _id?: Types.ObjectId;
  timestamp: number;
  time_spent: number;
  root_project?: {
    _id: Types.ObjectId;
    name: string;
  } | null;
};

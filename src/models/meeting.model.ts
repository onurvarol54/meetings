import { EntityModel } from './entity.model';

export interface MeetingModel extends EntityModel {
  title: string;
  examType: number;
  scheduledAt: string;
  description?: string;
  meetingStatus: number;
}

export const initialMeeting: MeetingModel = {
  id: '',
  title: '',
  examType: 0,
  scheduledAt: '',
  description: '',
  meetingStatus: 1,
  isActive: true,
  createdAt: '',
  createdBy: '',
  createdFullName: '',
};

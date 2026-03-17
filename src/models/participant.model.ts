import { EntityModel } from './entity.model';
import { MeetingModel } from './meeting.model';

export interface ParticipantModel extends EntityModel {
  meetingId: string;
  title: number;
  firstName: string;
  lastName: string;
  email: string;
  status: number;
  description?: string;
  keyExpiresAt?: string;
  keyUsedAt?: string;
  joinState?: number;
  participationState?: number;
  micState?: number;
  joinedAt?: string;
  leftAt?: string;
  canShareScreen?: boolean;
  // meeting?: MeetingModel;
}

export const initialParticipant: ParticipantModel = {
  id: '',
  meetingId: '',
  title: 0,
  firstName: '',
  lastName: '',
  email: '',
  status: 0,
  description: '',
  keyExpiresAt: '',
  keyUsedAt: '',
  joinState: 0,
  participationState: 0,
  micState: 0,
  joinedAt: '',
  leftAt: '',
  canShareScreen: true,
  isActive: true,
  createdAt: '',
  createdBy: '',
  createdFullName: '',
};

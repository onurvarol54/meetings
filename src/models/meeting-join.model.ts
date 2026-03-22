export interface MeetingJoinModel {
  meetingId: string;
  meetingCode: string;
  meetingTitle: string;
  examType: {
    value: number;
  };
  scheduledAt: string;
  description: string;
  meetingStatus: number;
  participantId: string;
  fullName: string;
  email: string;
  participantStatus: number;
  participantTitle: number;
  canStartMeeting: boolean;
  canFinishMeeting: boolean;
  hubToken: string;
}
export const initialMeetingJoin: MeetingJoinModel = {
  meetingId: '',
  meetingCode: '',
  meetingTitle: '',
  examType: {
    value: 0,
  },
  scheduledAt: '',
  description: '',
  meetingStatus: 1,
  participantId: '',
  fullName: '',
  email: '',
  participantStatus: 0,
  participantTitle: 0,
  canStartMeeting: false,
  canFinishMeeting: false,
  hubToken: '',
};

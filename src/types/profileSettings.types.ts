export type ProfileSettings = {
  userId: string;
  notificationsEnabled: boolean;
  communityAlertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSettingsPatch = {
  notificationsEnabled?: boolean;
  communityAlertsEnabled?: boolean;
};

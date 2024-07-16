export type TClinician = {
  email: string;
  name: string;
  videoPool?: {
    displayID: string;
    assetID: string;
  }[];
  isAdmin?: boolean;
};

export type TClinicianWrite = {
  email: string;
  name: string;
  videoPool?: {
    displayID: string;
    assetID: string;
  }[];
};

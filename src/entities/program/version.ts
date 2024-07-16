// Program version types
export type TProgramVersionBase = {
  programId: string;
  currentVersion: string; // version id
  isConsoleLive?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
  // TODO: Make this mandatory?
  createdAt?: Date;
  lastUpdatedAt?: Date;
};

export type TClinicianProgramVersion = TProgramVersionBase & {
  clinicianId: string;
  isArchived?: boolean;
};

export type TEuneoProgramVersion = TProgramVersionBase;

export type TProgramVersion = TClinicianProgramVersion | TEuneoProgramVersion;

export type TProgramVersionBaseWrite = {
  currentVersion: DocumentReference<TProgramWrite>;
  isConsoleLive?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
  // TODO: Make this mandatory?
  createdAt?: Timestamp;
  lastUpdatedAt?: Timestamp;
};

export type TClinicianProgramVersionWrite = TProgramVersionBaseWrite & {
  isArchived?: boolean;
};

export type TEuneoProgramVersionWrite = TProgramVersionBaseWrite;

export type TProgramVersionWrite =
  | TClinicianProgramVersionWrite
  | TEuneoProgramVersionWrite;

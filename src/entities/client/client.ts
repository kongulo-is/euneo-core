import { QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import {
  TClientProgram,
  TClientProgramIdentifiers,
  TClientProgramRef,
  deserializeClientProgramPath,
} from "./clientProgram";

export type TClientPreferences = {
  reminders: {
    exercise?: {
      enabled: boolean;
      hour?: number;
      minute?: number;
    };
  };
  showCompletedExercises: boolean;
};

export type TClientWrite = {
  name: string;
  gender: "male" | "female" | "other";
  platform: "android" | "ios";
  birthDate: string;
  email?: string;
  preferences: TClientPreferences;
  currentClientProgramRef?: TClientProgramRef;
  /**
   * @deprecated use currentClientProgramRef instead
   */
  currentProgramRef?: TClientProgramRef;
};

type TClientBase = {
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  platform: "ios" | "android";
  preferences: TClientPreferences;
};

type TClient_WithCurrentClientProgram_Read = TClientBase & {
  currentClientProgramRef?: TClientProgramRef;
  currentClientProgramIdentifiers?: TClientProgramIdentifiers;
};

export type TClientRead = TClientBase | TClient_WithCurrentClientProgram_Read;

export type TClient = TClientRead & {
  programs?: { [key: string]: TClientProgram };
  /**
   * @deprecated // TODO should this be ref and identifiers instead?
   */
  clientId: string;
};

export function hasCurrentClientProgram(
  client: TClientRead,
): client is TClient_WithCurrentClientProgram_Read {
  return "currentClientProgramRef" in client;
}

export const clientConverter = {
  toFirestore(client: TClient): TClientWrite {
    if (hasCurrentClientProgram(client)) {
      const { currentClientProgramIdentifiers, ...rest } = client;
      // TODO: Assert here?
      return {
        ...rest,
      };
    } else {
      const { ...rest } = client;
      // TODO: Assert here?
      return rest;
    }
  },
  // only needs to convert clientProgramRef to id
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClientWrite>,
    options: SnapshotOptions,
  ): TClientRead {
    const data = snapshot.data(options);
    let {
      currentProgramRef,
      currentClientProgramRef,
      name,
      birthDate,
      gender,
      platform,
      preferences,
    } = data;

    currentClientProgramRef = currentClientProgramRef || currentProgramRef;

    const client: TClientRead = {
      name,
      birthDate,
      gender,
      platform,
      preferences,
      ...(currentClientProgramRef && {
        currentClientProgramRef,
        currentClientProgramIdentifiers: deserializeClientProgramPath(
          currentClientProgramRef.path,
        ),
      }),
    };

    return client;
  },
};

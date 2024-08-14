import {
  deleteField,
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import {
  TClientProgram,
  TClientProgramIdentifiers,
  TClientProgramRef,
  deserializeClientProgramPath,
} from "./clientProgram";
import { Collection } from "../global";
import { db } from "../../firebase/db";
import { updateDoc } from "../../utilities/updateDoc";

export type TGender = "male" | "female" | "other";

export type TReminder = {
  enabled: boolean;
  hour?: number;
  minute?: number;
};

export type TClientPreferences = {
  reminders: {
    exercise?: TReminder;
  };
  showCompletedExercises: boolean;
};

export type TClientWrite = {
  name: string;
  gender: TGender;
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
  gender: TGender;
  platform: "ios" | "android";
  preferences: TClientPreferences;
};

type TClient_WithCurrentClientProgram_Read = TClientBase & {
  currentClientProgramRef: TClientProgramRef;
  currentClientProgramIdentifiers: TClientProgramIdentifiers;
};

export type TClientRead = TClientBase | TClient_WithCurrentClientProgram_Read;

export type TClient = TClientRead & {
  programs?: { [key: string]: TClientProgram };
  /**
   * @deprecated // TODO should this be ref and identifiers instead?
   */
  clientId: string;
};

export function createClientRef({
  clients,
}: {
  clients: string;
}): DocumentReference<TClientRead, TClientWrite> {
  const path = `${Collection.Clients}/${clients}`;

  return doc(db, path).withConverter(clientConverter);
}

export function hasCurrentClientProgram(
  client: TClientRead
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
    options: SnapshotOptions
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

    // TODO: remove this when all clients have updated programs,
    // TODO: https://www.notion.so/K-i-sem-m-ey-a-egar-stable-28f0c107f0a24b0693106f4992171392?pvs=4#061ee12014ae4da8bee674c101bb06f0
    if (currentProgramRef) {
      updateDoc(snapshot.ref.withConverter(clientConverter), {
        currentClientProgramRef: currentClientProgramRef || currentProgramRef,
        currentProgramRef: deleteField(),
      });
    }

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
          currentClientProgramRef.path
        ),
      }),
    };

    return client;
  },
};

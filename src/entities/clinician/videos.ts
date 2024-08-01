import {
  doc,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { Collection } from "../global";
import { db } from "../../firebase/db";

export type TClinicianVideoIdentifiers = {
  [Collection.Clinicians]: string;
  [Collection.Videos]: string;
};

export type TVClinicianideoRef = DocumentReference<
  TClinicianVideoRead,
  TClinicianVideoWrite
>;

export type TClinicianVideoRead = {
  displayID: string;
  assetID: string;
  date: Date;
};

export type TClinicianVideoWrite = {
  displayID: string;
  assetID: string;
  date: Timestamp;
};

export type TClinicianVideo = TClinicianVideoRead;

export function createClinicianVideoRef({
  clinicians,
  videos,
}: TClinicianVideoIdentifiers): DocumentReference<
  TClinicianVideoRead,
  TClinicianVideoWrite
> {
  return doc(
    db,
    Collection.Clinicians,
    clinicians,
    Collection.Videos,
    videos,
  ).withConverter(clinicianVideoConverter);
}

export const clinicianVideoConverter = {
  toFirestore(video: TClinicianVideoRead): TClinicianVideoWrite {
    const data: TClinicianVideoWrite = {
      displayID: video.displayID,
      assetID: video.assetID,
      date: Timestamp.fromDate(video.date),
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TClinicianVideoWrite>,
    options: SnapshotOptions,
  ): TClinicianVideoRead {
    const data = snapshot.data(options);
    const video: TClinicianVideoRead = {
      displayID: data.displayID,
      assetID: data.assetID,
      date: data.date.toDate(),
    };

    return video;
  },
};

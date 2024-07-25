import { QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

export type TOutcomeMeasureId =
  | "faam"
  | "sf-36"
  | "visa-a"
  | "promis"
  | "odi"
  | "pgq"
  | "hoos"
  | "koos"
  | "lefs";

export type TSectionGroup = {
  title: string;
  options: { option: string; value: number | null }[];
  questions: string[];
};

export type TOutcomeMeasureSection = {
  sectionName: string;
  results: {
    title: string;
    description: string;
  };
  athlete: boolean;
  groups: TSectionGroup[];
};

export type TOutcomeMeasureBase = {
  name: string;
  acronym: string;
  instructions: string;
  expectedTime: string;
  higherIsBetter: boolean;
  sections: TOutcomeMeasureSection[];
};

export type TOutcomeMeasure = TOutcomeMeasureBase & {
  id: TOutcomeMeasureId;
};

export type TOutcomeMeasureWrite = TOutcomeMeasureBase;

export const outcomeMeasureConverter = {
  toFirestore(measure: TOutcomeMeasure): TOutcomeMeasureWrite {
    const { id, ...rest } = measure;
    const data: TOutcomeMeasureWrite = {
      ...rest,
    };

    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<TOutcomeMeasureWrite>,
    options: SnapshotOptions
  ): TOutcomeMeasure {
    const data = snapshot.data(options);

    const measure: TOutcomeMeasure = {
      ...data,
      id: snapshot.id as TOutcomeMeasureId,
    };

    return measure;
  },
};

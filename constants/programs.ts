import { TEuneoProgramId } from "../types/datatypes";

type Programs = Record<TEuneoProgramId, string>;

export const programs: Programs = {
  "plantar-heel-pain": "Plantar Heel Pain",
};

export const programOptions = Object.entries(programs).map(
  ([value, label]) => ({
    value,
    label,
  })
);

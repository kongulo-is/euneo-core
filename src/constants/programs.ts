import { TEuneoProgramId } from "../types/baseTypes";

type Programs = Record<TEuneoProgramId, string>;

export const programs: Programs = {
  "plantar-heel-pain": "Plantar Heel Pain",
  "plantar-heel-pain-2.0": "Plantar Heel Pain 2.0",
  "plantar-heel-pain-3.0": "Plantar Heel Pain 3.0",
};

export const programOptions = Object.entries(programs).map(
  ([value, label]) => ({
    value,
    label,
  })
);

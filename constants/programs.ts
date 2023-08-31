//TODO: fix.
type ProgramKey = "plantar-heel-pain";

type Programs = Record<string, string>;

export const programs: Programs = {
  "plantar-heel-pain": "Plantar Heel Pain",
};

export const conditionOptions = Object.keys(programs).map((key) => ({
  value: key,
  label: programs[key as ProgramKey], // Use type assertion to ensure correct indexing
}));

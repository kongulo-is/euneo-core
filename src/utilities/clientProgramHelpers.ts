import { toZonedTime } from "date-fns-tz";
import { TClientProgram } from "../entities/client/clientProgram";
import { TOutcomeMeasureId } from "../entities/outcomeMeasure/outcomeMeasure";
import { TOutcomeMeasureAnswers } from "../entities/client/outcomeMeasureAnswer";

function _transformOutcomeMeasuresAnswersDates(
  outcomeMeasuresAnswers: Record<
    TOutcomeMeasureId,
    TOutcomeMeasureAnswers[]
  > | null,
  targetTimezone: string
): Record<Partial<TOutcomeMeasureId>, TOutcomeMeasureAnswers[]> | null {
  if (!outcomeMeasuresAnswers) return null;

  return Object.fromEntries(
    Object.entries(outcomeMeasuresAnswers).map(([key, answers]) => {
      const outcomeMeasureId = key as TOutcomeMeasureId;
      return [
        outcomeMeasureId,
        answers.map((answer) => ({
          ...answer,
          date: toZonedTime(answer.date, targetTimezone), // Adjust date to target timezone
        })),
      ];
    })
  ) as Record<Partial<TOutcomeMeasureId>, TOutcomeMeasureAnswers[]>;
}

export function normalizeClientProgramToTimezone(
  clientProgram: TClientProgram,
  fromTimezone: string,
  toTimezone: string
) {
  const programTimezone = clientProgram.originTimeZone || "UTC";
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Detect local timezone

  if (fromTimezone === toTimezone) return clientProgram;

  const normalizedDays = clientProgram.days.map((d) => {
    const normalizedDate = toZonedTime(d.date, toTimezone);

    return { ...d, date: normalizedDate };
  });

  const normalizedPainLevels = clientProgram.painLevels.map((p) => {
    const normalizedDate = toZonedTime(p.date, toTimezone);

    return { ...p, date: normalizedDate };
  });

  const normalizedOutcomeMeasuresAnswers =
    _transformOutcomeMeasuresAnswersDates(
      clientProgram.outcomeMeasuresAnswers,
      toTimezone
    );

  const denormalizedLastActive = clientProgram.lastActive
    ? toZonedTime(clientProgram.lastActive, toTimezone)
    : undefined;

  return {
    ...clientProgram,
    days: normalizedDays,
    painLevels: normalizedPainLevels,
    outcomeMeasuresAnswers: normalizedOutcomeMeasuresAnswers,
    ...(denormalizedLastActive && { lastActive: denormalizedLastActive }),
  };
}

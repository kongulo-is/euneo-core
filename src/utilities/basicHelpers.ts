import { Timestamp } from "firebase/firestore";

export const isEmptyObject = (obj: Object) =>
  Object.keys(obj || {}).length === 0;

export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const daysBetweenDates = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

// Returns number of days in a month
export const getNumOfDays = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};
export const capitalizeFirstLetter = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
};

// Function to convert a Date object to a string in the format "dd-mm-yyyy"
export function dateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Function to convert a string in the format "dd-mm-yyyy" to a Date object
export function stringToDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-").map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error("Invalid date string");
  }
  return new Date(year, month - 1, day); // Month is 0-based in JavaScript
}

export const isTodayOrBefore = (date: Date | Timestamp) => {
  let newDate: Date;
  if (date instanceof Timestamp) {
    newDate = new Date(date.toDate());
  } else {
    newDate = new Date(date);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  newDate.setHours(0, 0, 0, 0);

  return newDate <= today;
};

export function firestorePathToListObject(path: string): {
  [key: string]: string;
} {
  try {
    if (typeof path !== "string" || path.trim() === "") {
      throw new Error("Invalid path: Path must be a non-empty string");
    }

    const segments = path.split("/");
    if (segments.length % 2 !== 0) {
      throw new Error(
        "Invalid path: Path must have an even number of segments"
      );
    }

    const result: { [key: string]: string } = {};
    for (let i = 0; i < segments.length; i += 2) {
      const key = segments[i];
      const value = segments[i + 1];

      if (!key || !value) {
        throw new Error(`Invalid path: Missing key or value at segment ${i}`);
      }

      result[key] = value;
    }

    return result;
  } catch (error) {
    console.error(error);
    return {};
  }
}

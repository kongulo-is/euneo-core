import { getFunctions } from "firebase/functions";
import { app } from "./init";

// export const auth = getAuth(app);
export const functions = getFunctions(app);

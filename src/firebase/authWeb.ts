import { getAuth } from "firebase/auth";
import { app } from "./init";

export const auth = getAuth(app);

//.

import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";

//TODO: fix feedback type any.
export async function createFeedback(feedback: any, clientId: string) {
  try {
    const clientRef = doc(db, "clients", clientId);

    await addDoc(collection(db, "feedback"), {
      date: new Date(),
      asnwers: feedback.asnwers,
      // TODO: shoud user not be "client"?
      user: clientRef,
    });
  } catch (error) {
    console.error("Error creating feedback document: ", error, {
      feedback,
      clientId,
    });
    throw error;
  }
}

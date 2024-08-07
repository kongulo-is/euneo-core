import { addDoc, collection, doc } from "firebase/firestore";
import { db } from "../../firebase/db";
import { TFeedbackAnswer } from "../../entities/feedback/feedback";

export async function createFeedback(
  feedbackAnswers: TFeedbackAnswer[],
  clientId: string,
  platform: string,
) {
  try {
    const clientRef = doc(db, "clients", clientId);

    await addDoc(collection(db, "feedback"), {
      date: new Date(),
      answers: feedbackAnswers,
      client: clientRef,
      platform,
    });
  } catch (error) {
    console.error("Error creating feedback document: ", error, {
      feedbackAnswers,
      clientId,
    });
    throw error;
  }
}

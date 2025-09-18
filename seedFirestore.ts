import { readFile } from "node:fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  await readFile(new URL("./serviceAccountKey.json", import.meta.url), "utf8")
);
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const seed = JSON.parse(
  await readFile(new URL("./firestoreSeed.json", import.meta.url), "utf8")
) as any;

for (const [studentId, student] of Object.entries(seed.students)) {
  const { __collections__, ...doc } = student as any;
  const studentRef = db.collection("students").doc(studentId);

  await studentRef.set(doc);
  for (const [subName, records] of Object.entries(__collections__ ?? {})) {
    for (const [docId, payload] of Object.entries(
      records as Record<string, unknown>
    )) {
      await studentRef.collection(subName).doc(docId).set(payload);
    }
  }
}

console.log("Firestore seeding complete.");

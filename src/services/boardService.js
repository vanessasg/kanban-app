import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Boards ───────────────────────────────────────────────

export function subscribeToBoards(userId, callback) {
  const q = query(
    collection(db, "boards"),
    where("uid", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function createBoard(userId, title) {
  return addDoc(collection(db, "boards"), {
    uid: userId,
    title,
    createdAt: serverTimestamp(),
  });
}

export async function deleteBoard(boardId) {
  return deleteDoc(doc(db, "boards", boardId));
}

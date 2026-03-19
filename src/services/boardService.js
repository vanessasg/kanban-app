import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
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

// ─── Columns ──────────────────────────────────────────────

export function subscribeToColumns(boardId, callback) {
  const q = query(
    collection(db, "boards", boardId, "columns"),
    orderBy("order", "asc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function createColumn(boardId, title) {
  const snap = await getDocs(collection(db, "boards", boardId, "columns"));
  return addDoc(collection(db, "boards", boardId, "columns"), {
    title,
    order: snap.size,
    createdAt: serverTimestamp(),
  });
}

export async function updateColumn(boardId, columnId, data) {
  return updateDoc(doc(db, "boards", boardId, "columns", columnId), data);
}

export async function deleteColumn(boardId, columnId) {
  return deleteDoc(doc(db, "boards", boardId, "columns", columnId));
}

// ─── Tasks ────────────────────────────────────────────────

export function subscribeToTasks(boardId, columnId, callback) {
  const q = query(
    collection(db, "boards", boardId, "columns", columnId, "tasks"),
    orderBy("order", "asc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function createTask(boardId, columnId, title) {
  const snap = await getDocs(
    collection(db, "boards", boardId, "columns", columnId, "tasks"),
  );
  return addDoc(
    collection(db, "boards", boardId, "columns", columnId, "tasks"),
    {
      title,
      description: "",
      dueDate: null,
      tags: [],
      assignee: "",
      order: snap.size,
      createdAt: serverTimestamp(),
    },
  );
}

export async function updateTask(boardId, columnId, taskId, data) {
  return updateDoc(
    doc(db, "boards", boardId, "columns", columnId, "tasks", taskId),
    data,
  );
}

export async function deleteTask(boardId, columnId, taskId) {
  return deleteDoc(
    doc(db, "boards", boardId, "columns", columnId, "tasks", taskId),
  );
}

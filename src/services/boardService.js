import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Boards ───────────────────────────────────────────────

export function subscribeToBoards(userId, callback) {
  const q = query(
    collection(db, "boards"),
    where("uid", "==", userId),
    orderBy("order", "asc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function createBoard(userId, title) {
  const snap = await getDocs(
    query(collection(db, "boards"), where("uid", "==", userId)),
  );
  return addDoc(collection(db, "boards"), {
    uid: userId,
    title,
    order: snap.size,
    createdAt: serverTimestamp(),
  });
}

export async function deleteBoard(boardId) {
  return deleteDoc(doc(db, "boards", boardId));
}

export async function reorderBoards(userId, boards) {
  const batch = writeBatch(db);
  boards.forEach((board, index) => {
    batch.update(doc(db, "boards", board.id), { order: index });
  });
  return batch.commit();
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

export async function moveTask(boardId, fromColumnId, toColumnId, task) {
  const batch = writeBatch(db);

  batch.delete(
    doc(db, "boards", boardId, "columns", fromColumnId, "tasks", task.id),
  );

  const destRef = doc(
    collection(db, "boards", boardId, "columns", toColumnId, "tasks"),
  );
  batch.set(destRef, {
    title: task.title,
    description: task.description || "",
    dueDate: task.dueDate || null,
    tags: task.tags || [],
    assignee: task.assignee || "",
    order: task.order ?? 0,
    createdAt: serverTimestamp(),
  });

  return batch.commit();
}

export async function reorderTasks(boardId, columnId, tasks) {
  const batch = writeBatch(db);
  tasks.forEach((task, index) => {
    batch.update(
      doc(db, "boards", boardId, "columns", columnId, "tasks", task.id),
      { order: index },
    );
  });
  return batch.commit();
}

export async function reorderColumns(boardId, columns) {
  const batch = writeBatch(db);
  columns.forEach((col, index) => {
    batch.update(doc(db, "boards", boardId, "columns", col.id), {
      order: index,
    });
  });
  return batch.commit();
}

export async function getBoard(boardId) {
  const snap = await getDoc(doc(db, "boards", boardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateBoard(boardId, data) {
  return updateDoc(doc(db, "boards", boardId), data);
}

// ─── Subtasks ─────────────────────────────────────────────

export function subscribeToSubtasks(boardId, columnId, taskId, callback) {
  const q = query(
    collection(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
    ),
    orderBy("order", "asc"),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function createSubtask(boardId, columnId, taskId, title) {
  const snap = await getDocs(
    collection(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
    ),
  );
  const batch = writeBatch(db);
  const subtaskRef = doc(
    collection(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
    ),
  );
  batch.set(subtaskRef, {
    title,
    completed: false,
    order: snap.size,
    createdAt: serverTimestamp(),
  });
  batch.update(
    doc(db, "boards", boardId, "columns", columnId, "tasks", taskId),
    { subtasksCount: snap.size + 1 },
  );
  return batch.commit();
}

export async function updateSubtask(
  boardId,
  columnId,
  taskId,
  subtaskId,
  data,
) {
  await updateDoc(
    doc(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
      subtaskId,
    ),
    data,
  );
  // ricalcola completati
  const snap = await getDocs(
    collection(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
    ),
  );
  const completed = snap.docs.filter((d) => d.data().completed).length;
  return updateDoc(
    doc(db, "boards", boardId, "columns", columnId, "tasks", taskId),
    { subtasksCompleted: completed },
  );
}

export async function deleteSubtask(boardId, columnId, taskId, subtaskId) {
  const batch = writeBatch(db);
  batch.delete(
    doc(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
      subtaskId,
    ),
  );
  const snap = await getDocs(
    collection(
      db,
      "boards",
      boardId,
      "columns",
      columnId,
      "tasks",
      taskId,
      "subtasks",
    ),
  );
  const remaining = snap.docs.filter((d) => d.id !== subtaskId);
  const completed = remaining.filter((d) => d.data().completed).length;
  batch.update(
    doc(db, "boards", boardId, "columns", columnId, "tasks", taskId),
    { subtasksCount: remaining.length, subtasksCompleted: completed },
  );
  return batch.commit();
}
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  subscribeToColumns,
  createColumn,
  moveTask,
  reorderTasks,
  reorderColumns,
  getBoard,
  updateBoard,
} from "../services/boardService";
import Column from "../components/board/Column";
import TaskCard from "../components/task/TaskCard";

import Header from "../components/ui/Header";
import { useAuth } from "../context/AuthContext";

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [newColTitle, setNewColTitle] = useState("");
  const [showColForm, setShowColForm] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const [allTasks, setAllTasks] = useState({});
  const [search, setSearch] = useState("");

  const [boardTitle, setBoardTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  useEffect(() => {
    const unsub = subscribeToColumns(boardId, setColumns);
    return unsub;
  }, [boardId]);

  useEffect(() => {
    getBoard(boardId).then((board) => {
      if (board) setBoardTitle(board.title);
    });
  }, [boardId]);

  const handleTasksChange = useCallback((columnId, tasks) => {
    setAllTasks((prev) => ({ ...prev, [columnId]: tasks }));
  }, []);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    await createColumn(boardId, newColTitle.trim());
    setNewColTitle("");
    setShowColForm(false);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(active.data.current?.task ?? null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    // riordino colonne
    if (activeType === "column") {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(columns, oldIndex, newIndex);
      await reorderColumns(boardId, reordered);
      return;
    }

    // riordino / spostamento task
    const fromColumnId = active.data.current?.columnId;
    const task = active.data.current?.task;
    if (!task || !fromColumnId) return;

    const overIsColumn = columns.some((col) => col.id === over.id);
    const toColumnId = overIsColumn ? over.id : over.data.current?.columnId;

    if (!toColumnId) return;

    if (fromColumnId === toColumnId) {
      const columnTasks = allTasks[fromColumnId] ?? [];
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      await reorderTasks(boardId, fromColumnId, reordered);
      return;
    }

    await moveTask(boardId, fromColumnId, toColumnId, task);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/boards")}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            ← <span className="hidden sm:inline">Board</span>
          </button>
          <div className="relative max-w-xs w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca task…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowColForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0 hidden sm:inline-flex"
          >
            {showColForm ? "Annulla" : "+ Colonna"}
          </button>
        </div>
      </Header>

      <div
        className={`max-w-5xl w-full mx-auto px-6 pt-10 flex items-center justify-between  ${columns.length === 0 ? "flex-col gap-10 mb-0" : "mb-8"}`}
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          {editingTitle ? (
            <input
              className="text-2xl font-semibold tracking-tight bg-transparent border-b border-indigo-500 focus:outline-none text-white"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={async () => {
                if (boardTitle.trim())
                  await updateBoard(boardId, { title: boardTitle.trim() });
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setEditingTitle(true)}
              title="Click per rinominare"
            >
              <h1
                className="text-2xl font-semibold tracking-tight cursor-pointer"
                onClick={() => setEditingTitle(true)}
                title="Click per rinominare"
              >
                {boardTitle}
              </h1>
              <svg
                className="text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          )}
        </h1>
        <button
          onClick={() => setShowColForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-flex sm:hidden"
        >
          {showColForm ? "Annulla" : "+ Colonna"}
        </button>
      </div>

      {/* Add column form */}
      {showColForm && (
        <form
          onSubmit={handleAddColumn}
          className="flex gap-3 px-6 py-3 border-b border-gray-800 flex-shrink-0"
        >
          <input
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            placeholder="Nome colonna…"
            autoFocus
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors w-64"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Aggiungi
          </button>
        </form>
      )}

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-scroll flex flex-col sm:flex-row gap-4 p-6 overflow-x-auto flex-1 items-start">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.length === 0 ? (
              <div className="flex items-center justify-center w-full py-10 sm:py-24 text-gray-500">
                <div className="text-center">
                  <p className="text-lg">Nessuna colonna ancora.</p>
                  <p className="text-sm mt-1">
                    Aggiungi la prima colonna per iniziare.
                  </p>
                </div>
              </div>
            ) : (
              columns.map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  boardId={boardId}
                  onTasksChange={handleTasksChange}
                  search={search}
                />
              ))
            )}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

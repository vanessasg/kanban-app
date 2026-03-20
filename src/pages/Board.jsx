import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
  
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    const unsub = subscribeToColumns(boardId, setColumns);
    return unsub;
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
            ← Board
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
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            {showColForm ? "Annulla" : "+ Colonna"}
          </button>
        </div>
      </Header>

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
        <div className="kanban-scroll flex gap-4 p-6 overflow-x-auto flex-1 items-start">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.length === 0 ? (
              <div className="flex items-center justify-center w-full h-full text-gray-500">
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

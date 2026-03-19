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
import { arrayMove } from "@dnd-kit/sortable";
import {
  subscribeToColumns,
  createColumn,
  moveTask,
  reorderTasks,
} from "../services/boardService";
import Column from "../components/board/Column";
import TaskCard from "../components/task/TaskCard";

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [newColTitle, setNewColTitle] = useState("");
  const [showColForm, setShowColForm] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const [allTasks, setAllTasks] = useState({});

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

    const fromColumnId = active.data.current?.columnId;
    const task = active.data.current?.task;
    if (!task || !fromColumnId) return;

    // over può essere una colonna o un task
    const overIsColumn = columns.some((col) => col.id === over.id);
    const toColumnId = overIsColumn ? over.id : over.data.current?.columnId;

    if (!toColumnId) return;

    if (fromColumnId === toColumnId) {
      // riordino nella stessa colonna
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
      <header className="border-b border-gray-800 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => navigate("/boards")}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          ← Board
        </button>
        <button
          onClick={() => setShowColForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showColForm ? "Annulla" : "+ Colonna"}
        </button>
      </header>

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
              />
            ))
          )}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

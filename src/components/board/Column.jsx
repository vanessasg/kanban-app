import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  subscribeToTasks,
  createTask,
  deleteColumn,
  updateColumn,
} from "../../services/boardService";
import TaskCard from "../task/TaskCard";

export default function Column({ column, boardId, onTasksChange }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  useEffect(() => {
    const unsub = subscribeToTasks(boardId, column.id, (tasks) => {
      setTasks(tasks);
      onTasksChange(column.id, tasks);
    });
    return unsub;
  }, [boardId, column.id, onTasksChange]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask(boardId, column.id, newTaskTitle.trim());
    setNewTaskTitle("");
    setShowTaskForm(false);
  };

  const handleRenameColumn = async () => {
    if (colTitle.trim() && colTitle !== column.title) {
      await updateColumn(boardId, column.id, { title: colTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleDeleteColumn = async () => {
    if (!window.confirm(`Eliminare la colonna "${column.title}"?`)) return;
    await deleteColumn(boardId, column.id);
  };

  return (
    <div
      className={`flex-shrink-0 w-80 bg-gray-900 border rounded-xl flex flex-col max-h-[calc(100vh-120px)] transition-colors ${isOver ? "border-indigo-500" : "border-gray-800"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        {editingTitle ? (
          <input
            className="flex-1 bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            onBlur={handleRenameColumn}
            onKeyDown={(e) => e.key === "Enter" && handleRenameColumn()}
            autoFocus
          />
        ) : (
          <h2
            className="text-sm font-semibold cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2"
            onClick={() => setEditingTitle(true)}
            title="Click per rinominare"
          >
            {column.title}
            <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </h2>
        )}
        <button
          onClick={handleDeleteColumn}
          className="text-gray-600 hover:text-red-400 transition-colors ml-3 text-xl leading-none pb-0.5"
        >
          ×
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[60px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} columnId={column.id} />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      <div className="p-3 border-t border-gray-800">
        {showTaskForm ? (
          <form onSubmit={handleAddTask} className="flex flex-col gap-2">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Titolo task…"
              autoFocus
              required
              className="bg-gray-800 border border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none w-full"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Aggiungi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTaskForm(false);
                  setNewTaskTitle("");
                }}
                className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowTaskForm(true)}
            className="w-full text-left text-sm text-gray-500 hover:text-white border border-dashed border-gray-700 hover:border-indigo-500 px-3 py-2 rounded-lg transition-colors"
          >
            + Aggiungi task
          </button>
        )}
      </div>
    </div>
  );
}

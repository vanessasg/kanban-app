import { useEffect, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  subscribeToTasks,
  createTask,
  deleteColumn,
  updateColumn,
} from "../../services/boardService";
import TaskCard from "../task/TaskCard";
import TaskModal from "../task/TaskModal";
import ConfirmModal from "../ui/ConfirmModal";

export default function Column({ column, boardId, onTasksChange, search }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // useSortable per il drag della colonna
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  // useDroppable per ricevere i task
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const handleDeleteColumn = () => {
    setConfirmDelete({
      title: "Elimina colonna",
      message: `Eliminare la colonna "${column.title}" e tutti i suoi task?`,
      onConfirm: async () => await deleteColumn(boardId, column.id),
    });
  };
  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`shrink-0 w-full sm:w-80 bg-gray-900 border rounded-xl flex flex-col max-h-[calc(100vh-120px)] transition-colors ${
        isDragging
          ? "border-indigo-500"
          : isOver
            ? "border-indigo-500"
            : "border-gray-800"
      }`}
    >
      {/* Header — drag listeners solo qui */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-4 py-3 border-b border-gray-800 cursor-grab active:cursor-grabbing"
      >
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

      {/* Tasks — drop zone */}
      <div
        ref={setDropRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-15"
      >
        <SortableContext
          items={filteredTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onClick={() => setSelectedTask(task)}
            />
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

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardId={boardId}
          columnId={column.id}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.title}
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

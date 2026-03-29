import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TAG_COLORS } from "./TAG_COLORS";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
  if (diff < 0) return { text: formatted, style: "bg-red-500/15 text-red-400" };
  if (diff <= 2)
    return { text: formatted, style: "bg-orange-500/15 text-orange-400" };
  return { text: formatted, style: "bg-gray-700 text-gray-400" };
}

export default function TaskCard({ task, columnId, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task, columnId, type: "task" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dateInfo = formatDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all flex flex-col gap-2"
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-white leading-snug break-all">
          {task.title}
        </p>
        {task.subtasksCount > 0 && (
          <div className="flex items-center gap-1.5">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span
              className={`text-xs ${task.subtasksCompleted === task.subtasksCount ? "text-green-400" : "text-gray-500"}`}
            >
              {task.subtasksCompleted ?? 0}/{task.subtasksCount}
            </span>
          </div>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 leading-snug line-clamp-2 break-all">
          {task.description}
        </p>
      )}

      {(task.tags?.length > 0 || dateInfo || task.assignee) && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex flex-wrap gap-1">
            {task.tags?.map((tag) => (
              <span
                key={tag}
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] ?? "bg-gray-700 text-gray-400 border-gray-600"}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {dateInfo && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${dateInfo.style}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {dateInfo.text}
              </span>
            )}
            {task.assignee && (
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {task.assignee.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

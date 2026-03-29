import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { TAG_COLORS } from "../task/TAG_COLORS";
import {
  TbArrowsSort,
  TbSortAscending,
  TbSortDescending,
} from "react-icons/tb";

import ConfirmModal from "../ui/ConfirmModal";

const columnHelper = createColumnHelper();

export default function TableView({
  columns,
  allTasks,
  onRowClick,
  search = "",
  onDeleteTasks,
  onMoveTasks,
}) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [rowSelection, setRowSelection] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const exportCSVExcel = () => {
    const headers = [
      "Titolo",
      "Colonna",
      "Assignee",
      "Scadenza",
      "Descrizione",
      "Tag",
    ];
    const rows = selectedTasks.map((t) => [
      t.title,
      t.columnName,
      t.assignee || "",
      t.dueDate || "",
      t.description || "",
      (t.tags || []).join(" | "),
    ]);
    const csv =
      "sep=,\n" +
      [headers, ...rows]
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks_excel.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSVNumbers = () => {
    const headers = [
      "Titolo",
      "Colonna",
      "Assignee",
      "Scadenza",
      "Descrizione",
      "Tag",
    ];
    const rows = selectedTasks.map((t) => [
      t.title,
      t.columnName,
      t.assignee || "",
      t.dueDate || "",
      t.description || "",
      (t.tags || []).join(" | "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks_numbers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = selectedTasks.map(
      ({ title, columnName, assignee, dueDate, description, tags }) => ({
        title,
        columnName,
        assignee,
        dueDate,
        description,
        tags,
      }),
    );
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const data = useMemo(() => {
    const flat = Object.entries(allTasks).flatMap(([columnId, tasks]) =>
      tasks.map((task) => ({
        ...task,
        columnId,
        columnName: columns.find((c) => c.id === columnId)?.title || "",
      })),
    );

    if (!search.trim()) return flat;
    const q = search.toLowerCase();
    return flat.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [allTasks, columns, search]);

  const tableColumns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        size: 40,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 accent-indigo-600 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-indigo-600 cursor-pointer"
          />
        ),
      }),
      columnHelper.accessor("title", {
        header: "Task",
        size: 250,
        cell: (info) => (
          <span className="font-medium text-white">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("columnName", {
        header: "Colonna",
        size: 120,
        cell: (info) => (
          <span className="text-indigo-400">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("dueDate", {
        header: "Scadenza",
        size: 150,
        cell: (info) => {
          const value = info.getValue();
          if (!value) return <span className="text-gray-500">—</span>;
          const date = value.seconds
            ? new Date(value.seconds * 1000)
            : new Date(value);
          return (
            <span className="text-gray-300">{date.toLocaleDateString()}</span>
          );
        },
        sortingFn: (a, b) => {
          const da = a.original.dueDate;
          const db = b.original.dueDate;
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          const ta = da.seconds ? da.seconds * 1000 : new Date(da).getTime();
          const tb = db.seconds ? db.seconds * 1000 : new Date(db).getTime();
          return ta - tb;
        },
      }),
      columnHelper.accessor("description", {
        header: "Descrizione",
        size: 220,
        cell: (info) => (
          <span className="text-gray-300">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("assignee", {
        header: "Assignee",
        size: 110,
        cell: (info) => (
          <span className="text-gray-300">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        enableSorting: false,
        size: 180,
        cell: (info) => {
          const tags = info.getValue() || [];
          return (
            <div className="flex flex-wrap gap-1">
              {tags.length === 0 ? (
                <span className="text-gray-500">—</span>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] ?? "bg-gray-700 text-gray-400 border-gray-600"}`}
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          );
        },
      }),
      
    ],
    [],
  );



  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  const selectedTasks = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="p-6">
      {/* Action bar */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5">
          <div>
            <span className="text-sm text-gray-400 flex-1">
              <span className="text-white font-medium">
                {selectedTasks.length}
              </span>{" "}
              task selezionati
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={exportCSVExcel}
              className="text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Esporta CSV (Excel)
            </button>
            <button
              onClick={exportCSVNumbers}
              className="text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Esporta CSV (Numbers/Google Sheets)
            </button>
            <button
              onClick={exportJSON}
              className="text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Esporta JSON
            </button>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onMoveTasks(selectedTasks, e.target.value);
                e.target.value = "";
              }}
              className="text-xs bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-1.5 rounded-lg focus:outline-none transition-colors"
            >
              <option value="" disabled>
                Sposta in…
              </option>
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                setConfirmDelete({
                  title: "Elimina task",
                  message: `Eliminare ${selectedTasks.length} task selezionati? L'operazione è irreversibile.`,
                  onConfirm: () => onDeleteTasks(selectedTasks),
                })
              }
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              Elimina
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto kanban-scroll">
          <table className="w-full text-sm min-w-max overflow-scroll">
            <thead className="bg-gray-800 text-gray-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-left px-4 py-3 font-medium"
                    >
                      {header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" ? (
                            <TbSortAscending
                              className="text-indigo-400"
                              size={15}
                            />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <TbSortDescending
                              className="text-indigo-400"
                              size={15}
                            />
                          ) : (
                            <TbArrowsSort size={15} />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className="text-center py-10 text-gray-500"
                  >
                    {search
                      ? `Nessun risultato per "${search}"`
                      : "Nessun task"}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className="border-t border-gray-800 hover:bg-gray-800/60 cursor-pointer transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="px-4 py-3"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-xs text-gray-500">
                Pagina {table.getState().pagination.pageIndex + 1} di{" "}
                {table.getPageCount()} — {data.length} task
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-400 focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} per pagina
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                «
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                    table.getState().pagination.pageIndex === i
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

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

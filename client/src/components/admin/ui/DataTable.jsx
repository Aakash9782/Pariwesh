import React, { useState } from "react";
import {
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from "react-icons/ri";
import SkeletonLoader from "./SkeletonLoader.jsx";
import EmptyState from "./EmptyState.jsx";
import Pagination from "./Pagination.jsx";

const DataTable = ({
  columns = [], // Array of { key, label, sortable, render }
  data = [],
  isLoading = false,
  emptyMessage,
  emptySubtitle,
  sortBy,
  sortOrder, // 'asc' | 'desc'
  onSort,
  // Selection
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  bulkActions,
  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  rowKey = "_id",
}) => {
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const handleSelectAll = (e) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (onSelectRow) {
      onSelectRow(id, checked);
    }
  };

  const getSortIcon = (colKey) => {
    if (sortBy !== colKey)
      return <RiArrowUpDownLine className="w-3.5 h-3.5 text-slate-400" />;
    return sortOrder === "asc" ? (
      <RiArrowUpLine className="w-3.5 h-3.5 text-[#c5a880]" />
    ) : (
      <RiArrowDownLine className="w-3.5 h-3.5 text-[#c5a880]" />
    );
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="w-full space-y-4">
      {/* Bulk Action Floating Toolbar Layer */}
      {selectedIds.length > 0 && bulkActions && (
        <div className="bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-[#c5a880]/15 text-[#c5a880] px-2.5 py-0.5 rounded">
              {selectedIds.length} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Main Responsive Table Wrapper */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xxs overflow-hidden">
        <div className="overflow-x-auto w-full relative">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* Sticky Table Header */}
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                {onSelectRow && (
                  <th className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-[#c5a880] w-4 h-4 rounded-sm border-slate-300"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    className={`px-5 py-3 text-xs tracking-wider select-none ${
                      col.sortable
                        ? "cursor-pointer hover:bg-slate-100 hover:text-slate-700"
                        : ""
                    } ${col.className || ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {isLoading ? (
                // Skeleton Mock rows loading indicators
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {onSelectRow && (
                      <td className="px-4 py-4 text-center">
                        <SkeletonLoader className="w-4 h-4 mx-auto rounded-sm" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-4">
                        <SkeletonLoader className="h-4 w-4/5 rounded-xs" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectRow ? 1 : 0)}
                    className="py-12"
                  >
                    <EmptyState
                      title={emptyMessage || "No Entries Recorded"}
                      subtitle={
                        emptySubtitle ||
                        "Please refine your filter preferences or create a new entry"
                      }
                    />
                  </td>
                </tr>
              ) : (
                // Table Rows
                data.map((row) => {
                  const id = row[rowKey];
                  const isRowSelected = selectedIds.includes(id);
                  return (
                    <tr
                      key={id}
                      onMouseEnter={() => setHoveredRowId(id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={`border-b border-slate-100 last:border-0 transition-colors duration-150 ${
                        isRowSelected
                          ? "bg-[#c5a880]/5"
                          : hoveredRowId === id
                            ? "bg-slate-50/70"
                            : ""
                      }`}
                    >
                      {onSelectRow && (
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) =>
                              handleSelectRow(id, e.target.checked)
                            }
                            className="cursor-pointer accent-[#c5a880] w-4 h-4 rounded-sm border-slate-300"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-5 py-4 text-xs font-sans text-slate-700 leading-relaxed ${
                            col.className || ""
                          }`}
                        >
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer Section */}
      {!isLoading && data.length > 0 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) =>
                onItemsPerPageChange &&
                onItemsPerPageChange(Number(e.target.value))
              }
              className="bg-white border border-slate-200 text-xs text-slate-600 h-8 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
            >
              {[5, 10, 20, 50].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;

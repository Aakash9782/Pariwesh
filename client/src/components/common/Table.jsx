import React from "react";

const Table = ({
  headers = [],
  data = [],
  renderRow,
  loading = false,
  emptyMessage = "No records found.",
  className = "",
}) => {
  return (
    <div
      className={`w-full overflow-x-auto border border-borderLight rounded-card bg-primary ${className}`}
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-bgLight text-textSecondary uppercase font-display border-b border-borderLight">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-4 font-bold tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-borderLight text-textPrimary">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-8 text-center">
                <span className="inline-block animate-spin h-5 w-5 border-2 border-accent-gold border-t-transparent rounded-full" />
                <span className="block mt-2 text-textSecondary font-semibold">
                  Loading data...
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-8 text-center text-textSecondary font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => renderRow(item, idx))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

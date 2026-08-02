import React from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 rounded-md p-1.5 shadow-xxs">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 px-1.5 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Previous Page"
      >
        <RiArrowLeftSLine className="w-4 h-4" />
      </button>

      <div className="flex items-center space-x-1">
        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[28px] h-7 text-xs font-semibold rounded-md border flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#c5a880] border-[#c5a880] text-white shadow-xxs"
                  : "bg-white border-transparent text-slate-655 hover:bg-slate-50 hover:border-slate-205"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
        className="p-1 px-1.5 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:hover:bg-transparent"
        aria-label="Next Page"
      >
        <RiArrowRightSLine className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;

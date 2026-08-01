import React from "react";
import Button from "./Button.jsx";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-center space-x-2 text-xs font-sans ${className}`}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-btn font-semibold px-3 py-1.5 focus:ring-0 active:scale-95"
      >
        Prev
      </Button>

      {[...Array(totalPages)].map((_, index) => {
        const page = index + 1;
        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-full border transition-all font-bold flex items-center justify-center active:scale-90 ${
              isCurrent
                ? "bg-secondary text-primary border-secondary"
                : "border-borderLight hover:border-textSecondary text-textPrimary bg-primary"
            }`}
          >
            {page}
          </button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-btn font-semibold px-3 py-1.5 focus:ring-0 active:scale-95"
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;

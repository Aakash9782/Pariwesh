import React from "react";
import Select from "./Select.jsx";

const FilterBar = ({
  filters = [], // Array of { label, value, onChange, options }
  onReset,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 w-full ${className}`}>
      {filters.map((f, index) => (
        <div key={index} className="w-full sm:w-auto min-w-[140px]">
          <Select
            label={f.label}
            value={f.value}
            onChange={(e) => f.onChange && f.onChange(e.target.value)}
            options={f.options}
          />
        </div>
      ))}
      {onReset && (
        <div className="flex items-end h-[58px] sm:h-auto sm:self-end pb-[1px]">
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-slate-700 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

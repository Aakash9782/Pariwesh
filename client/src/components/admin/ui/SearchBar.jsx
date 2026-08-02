import React from "react";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";

const SearchBar = ({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  ...props
}) => {
  return (
    <div className={`relative h-10 w-full max-w-xs md:max-w-sm ${className}`}>
      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
        <RiSearchLine className="w-4 h-4" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full pl-9 pr-8 bg-white border border-slate-250 rounded-md text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#c5a880] focus:border-[#c5a880]"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-650"
        >
          <RiCloseLine className="w-4.5 h-4.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

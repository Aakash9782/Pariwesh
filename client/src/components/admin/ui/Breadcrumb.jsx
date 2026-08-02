import React from "react";
import { Link } from "react-router-dom";
import { RiArrowRightSLine } from "react-icons/ri";

const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex text-[10px] uppercase font-bold tracking-wider text-slate-400 font-display">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <RiArrowRightSLine className="w-3.5 h-3.5 mx-1 text-slate-350" />
              )}
              {isLast ? (
                <span className="text-[#c5a880]">{item.label}</span>
              ) : item.path ? (
                <Link
                  to={item.path}
                  className="hover:text-[#c5a880] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

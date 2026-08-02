import React from "react";
import Breadcrumb from "./Breadcrumb.jsx";

const PageHeader = ({ title, subtitle, breadcrumbs, actions }) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in">
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <h1 className="text-2xl font-display font-semibold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-sans tracking-wide max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

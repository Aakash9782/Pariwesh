import React from "react";

const Tabs = ({ tabs = [], activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`border-b border-borderLight w-full ${className}`}>
      <div className="flex space-x-8 overflow-x-auto bg-transparent scrollbar-none">
        {tabs.map((tab) => {
          const tabId = tab.id ?? tab;
          const label = tab.label ?? tab;
          const isSelected = activeTab === tabId;

          return (
            <button
              key={tabId}
              onClick={() => onTabChange(tabId)}
              className={`py-3 text-xs font-display uppercase tracking-widest font-bold border-b-2 transition-all focus:outline-none whitespace-nowrap ${
                isSelected
                  ? "border-accent-gold text-accent-gold"
                  : "border-transparent text-textSecondary hover:text-textPrimary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;

import React from "react";

const PlaceholderPage = ({ title }) => (
  <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
    <h2 className="text-3xl font-display font-medium text-textPrimary">
      {title}
    </h2>
    <p className="text-sm text-textSecondary">
      This page is scheduled for initialization in future roadmap steps.
    </p>
  </div>
);

export default PlaceholderPage;

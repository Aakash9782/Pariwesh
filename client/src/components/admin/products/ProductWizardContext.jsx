import { createContext, useContext } from "react";

export const ProductWizardContext = createContext(null);

export const useProductWizard = () => {
  const context = useContext(ProductWizardContext);
  if (!context) {
    throw new Error(
      "useProductWizard must be used within a ProductWizardProvider",
    );
  }
  return context;
};

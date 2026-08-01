import React from "react";
import {
  RiShoppingBagLine,
  RiHeartLine,
  RiHeartFill,
  RiUserLine,
  RiSearchLine,
  RiMenuLine,
  RiCloseLine,
  RiSunLine,
  RiMoonLine,
  RiPaletteLine,
  RiWhatsappLine,
  RiOrderPlayLine,
  RiMapPinLine,
  RiUser3Line,
  RiLogoutBoxRLine,
  RiDeleteBinLine,
  RiAddLine,
  RiSubtractLine,
  RiRulerLine,
  RiShieldCheckLine,
  RiRefreshLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiAlertLine,
  RiArrowRightLine,
} from "react-icons/ri";

// Central Icons Registry
export const Icons = {
  Bag: RiShoppingBagLine,
  HeartOutline: RiHeartLine,
  HeartFill: RiHeartFill,
  User: RiUserLine,
  UserAlt: RiUser3Line,
  Search: RiSearchLine,
  Menu: RiMenuLine,
  Close: RiCloseLine,
  Sun: RiSunLine,
  Moon: RiMoonLine,
  Palette: RiPaletteLine,
  Whatsapp: RiWhatsappLine,
  Order: RiOrderPlayLine,
  MapPin: RiMapPinLine,
  Logout: RiLogoutBoxRLine,
  Delete: RiDeleteBinLine,
  Add: RiAddLine,
  Subtract: RiSubtractLine,
  SizeChart: RiRulerLine,
  ShieldCheck: RiShieldCheckLine,
  Refresh: RiRefreshLine,
  Info: RiInformationLine,
  Success: RiCheckboxCircleLine,
  Warning: RiAlertLine,
  Error: RiErrorWarningLine,
  ArrowRight: RiArrowRightLine,
};

// Global Icon Parameters
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Reusable Icon Component to enforce central sizes, styling & libraries
 */
const Icon = ({ name, size = "md", className = "", ...props }) => {
  const IconComponent = Icons[name];
  if (!IconComponent) return null;

  const actualSize = ICON_SIZES[size] ?? size;

  return (
    <IconComponent
      size={actualSize}
      className={`transition-colors duration-200 ${className}`}
      {...props}
    />
  );
};

export default Icon;

import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import WorkspaceSwitcher from '@site/src/theme/NavbarItem/WorkspaceSwitcherNavbarItem';

/**
 * 🗺️ Navbar Component Mapping
 * We extend the default Docusaurus Navbar items to include our custom
 * WorkspaceSwitcher type.
 */
export default {
  ...ComponentTypes,
  'custom-WorkspaceSwitcher': WorkspaceSwitcher,
};

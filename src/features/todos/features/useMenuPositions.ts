import { useRef } from "react";
import { View } from "react-native";
import { MenuPosition } from "@/features/todos/features/useTodosState";

interface UseMenuPositionsArgs {
  isMobile: boolean;
  setFilterPosition: (pos: MenuPosition) => void;
  setShowFilters: (v: boolean) => void;
  setMultipleDeletePosition: (pos: MenuPosition) => void;
  setShowMultipleDelete: (v: boolean) => void;
}

export function useMenuPositions({
  isMobile,
  setFilterPosition,
  setShowFilters,
  setMultipleDeletePosition,
  setShowMultipleDelete,
}: UseMenuPositionsArgs) {
  const screenRef = useRef<View>(null);
  const filterButtonRef = useRef<View>(null);
  const multipleDeleteRef = useRef<View>(null);

  /* =========================================================
   * OPEN FILTER MENU
   * ========================================================= */

  const openFilterMenu = () => {
    if (!filterButtonRef.current || !screenRef.current) {
      return;
    }

    filterButtonRef.current.measureInWindow(
      (buttonX, buttonY, buttonWidth, buttonHeight) => {
        screenRef.current?.measureInWindow(
          (screenX, screenY, screenWidth) => {
            const menuWidth = isMobile ? 168 : 188;

            let left =
              buttonX - screenX + buttonWidth - menuWidth;

            if (left < 8) {
              left = 8;
            }

            if (left + menuWidth > screenWidth - 8) {
              left = screenWidth - menuWidth - 8;
            }

            setFilterPosition({
              top: buttonY - screenY + buttonHeight + 6,
              left,
            });

            setShowFilters(true);
          }
        );
      }
    );
  };

  /* =========================================================
   * OPEN MULTIPLE DELETE MENU
   * ========================================================= */

  const openMultipleDeleteMenu = () => {
    if (!multipleDeleteRef.current || !screenRef.current) {
      setShowMultipleDelete(true);
      return;
    }

    multipleDeleteRef.current.measureInWindow(
      (buttonX, buttonY, buttonWidth, buttonHeight) => {
        screenRef.current?.measureInWindow(
          (screenX, screenY, screenWidth) => {
            const menuWidth = isMobile ? 190 : 210;

            let left =
              buttonX - screenX + buttonWidth - menuWidth;

            if (left < 8) {
              left = 8;
            }

            if (left + menuWidth > screenWidth - 8) {
              left = screenWidth - menuWidth - 8;
            }

            setMultipleDeletePosition({
              top: buttonY - screenY + buttonHeight + 6,
              left,
            });

            setShowMultipleDelete(true);
          }
        );
      }
    );
  };

  return {
    screenRef,
    filterButtonRef,
    multipleDeleteRef,
    openFilterMenu,
    openMultipleDeleteMenu,
  };
}

import { OffcanvasComponents } from "@/components/custom/offcanvas/offcanvas-components";
import { OffcanvasWrapper } from "@/components/custom/offcanvas/offcanvas-warpper";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const OffcanvasContext = createContext();
export const useOffcanvas = () => useContext(OffcanvasContext);

export const OffcanvasProvider = ({ children }) => {
  const [panels, setPanels] = useState({});
  const [offcanvasClosed, setOffcanvasClosed] = useState(null); 

  const openOffcanvas = useCallback((key, props = {}, position = "right") => {
    if (!OffcanvasComponents[key]) {
      console.warn(`Offcanvas "${key}" topilmadi`);
      return;
    }
    setPanels((prev) => ({
      ...prev,
      [key]: { isOpen: true, props, position },
    }));
  }, []);

  const closeOffcanvas = useCallback((key, data = null) => {
    setPanels((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], isOpen: false },
      };
    });

    // 🔹 Yopilganda ma'lumotni signal sifatida yuboramiz
    setOffcanvasClosed(data);

    setTimeout(() => {
      setOffcanvasClosed(null);
      setPanels((prev) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }, 300);
  }, []);

  // Context value'ni optimallashtiramiz
  const contextValue = useMemo(
    () => ({
      openOffcanvas,
      closeOffcanvas,
      offcanvasClosed,
    }),
    [openOffcanvas, closeOffcanvas, offcanvasClosed]
  );

  return (
    <OffcanvasContext.Provider value={contextValue}>
      {children}
      {Object.entries(panels).map(([key, panel]) => {
        const Component = OffcanvasComponents[key];
        if (!Component) return null;

        return (
          <OffcanvasWrapper
            key={key}
            isOpen={panel.isOpen}
            position={panel.position}
            onClose={() => closeOffcanvas(key)}
          >
            <Component
              {...panel.props}
              close={(data) => closeOffcanvas(key, data)}
            />
          </OffcanvasWrapper>
        );
      })}
    </OffcanvasContext.Provider>
  );
};

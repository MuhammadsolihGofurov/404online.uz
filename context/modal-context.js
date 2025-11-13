import React, { createContext, useContext, useState } from "react";
import { ModalWrapper } from "@/components/custom/modal/modal-wrapper";
import { ModalComponents } from "@/components/custom/modal/modal-compontents";

const ModalContext = createContext();
export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});
  const [modalClosed, setModalClosed] = useState(null); // 🔹 yangi flag

  const openModal = (key, props = {}, size = "big") => {
    if (!ModalComponents[key]) {
      console.warn(`Modal with key "${key}" does not exist`);
      return;
    }
    setModals((prev) => ({
      ...prev,
      [key]: { isOpen: true, props, size },
    }));
  };

  const closeModal = (key, data = null) => {
    setModals((prev) => ({
      ...prev,
      [key]: { ...prev[key], isOpen: false },
    }));

    // 🔹 modal yopilganda signal beramiz
    setModalClosed(data);

    setTimeout(() => setModalClosed(null), 300);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, modalClosed }}>
      {children}
      {Object.entries(modals).map(([key, modal]) => {
        if (!modal.isOpen) return null;
        const Component = ModalComponents[key];
        return (
          <ModalWrapper
            key={key}
            size={modal.size}
            onClose={() => closeModal(key)}
          >
            <Component {...modal.props} />
          </ModalWrapper>
        );
      })}
    </ModalContext.Provider>
  );
};

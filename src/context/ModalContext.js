import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import CustomModal from '../components/common/CustomModal';

const ModalContext = createContext({
  showModal: (title, message, options) => {},
  hideModal: () => {},
});

export const ModalProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    options: [],
  });
  
  // Use a ref to track if we just closed one, to prevent rapid double-opening issues if necessary,
  // though simple state is usually fine.

  const showModal = useCallback((title, message, options = []) => {
    setModalConfig({
      title,
      message,
      options,
    });
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    // Optional: Clear config after animation or immediately
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <CustomModal
        visible={visible}
        title={modalConfig.title}
        message={modalConfig.message}
        options={modalConfig.options}
        onClose={hideModal}
      />
    </ModalContext.Provider>
  );
};

export const useCustomModal = () => useContext(ModalContext);

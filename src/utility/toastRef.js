let toastFunc = null;

export const setToastRef = func => {
  toastFunc = func;
};

export const showToast = (message, type = 'info') => {
  if (toastFunc) {
    toastFunc(message, type);
  } else {
    console.log('[Toast Service]:', message);
  }
};

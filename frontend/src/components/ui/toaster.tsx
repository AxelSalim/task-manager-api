'use client';

import { ToastContainer } from 'react-toastify';

export function Toaster() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      stacked
      limit={5}
    />
  );
}

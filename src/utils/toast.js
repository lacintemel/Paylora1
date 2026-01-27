import toast from 'react-hot-toast';

// Başarı mesajı
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '16px',
    },
  });
};

// Hata mesajı
export const showError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '16px',
    },
  });
};

// Bilgi mesajı
export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '16px',
    },
  });
};

// Uyarı mesajı
export const showWarning = (message) => {
  toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '16px',
    },
  });
};

// Loading mesajı
export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#6B7280',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '16px',
    },
  });
};

// Promise ile toast (async işlemler için)
export const showPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'İşlem yapılıyor...',
      success: messages.success || 'Başarılı!',
      error: messages.error || 'Hata oluştu!',
    },
    {
      style: {
        borderRadius: '12px',
        fontWeight: 'bold',
        padding: '16px',
      },
    }
  );
};

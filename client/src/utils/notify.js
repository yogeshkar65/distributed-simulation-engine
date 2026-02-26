import toast from "react-hot-toast";

const toastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
        background: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '16px',
    },
};

export const notify = {
    success: (message) => toast.success(message, toastOptions),
    error: (message) => toast.error(message, toastOptions),
    warning: (message) => toast.error(message, {
        ...toastOptions,
        icon: '⚠️',
        style: {
            ...toastOptions.style,
            borderLeft: '4px solid #f59e0b',
        },
    }),
    loading: (message) => toast.loading(message, toastOptions),
    dismiss: (toastId) => toast.dismiss(toastId),
};

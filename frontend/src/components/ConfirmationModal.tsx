interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: 'default' | 'danger';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmVariant = 'default',
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-accent text-white hover:brightness-90';

  return (
    // The z-50 ensures this is on top of all other modals (like GroupInfoModal which is z-20)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg p-6 w-full max-w-md shadow-lg" onClick={e => e.stopPropagation()}>
        <h2 className={`text-xl font-bold mb-4 ${confirmVariant === 'danger' ? 'text-red-500' : 'text-primary-text'}`}>
          {title}
        </h2>
        
        <div className="text-secondary-text mb-6 whitespace-pre-wrap">
          {message}
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-primary-border text-primary-text font-semibold py-2 rounded-lg hover:brightness-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 font-semibold py-2 rounded-lg disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
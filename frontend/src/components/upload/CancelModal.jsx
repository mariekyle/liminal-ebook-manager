/**
 * CancelModal.jsx
 * 
 * Confirmation modal for canceling an upload.
 */

export default function CancelModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#2a2a2a] rounded-xl max-w-[400px] w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#3a3a3a] font-semibold">
          Cancel Upload?
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <p className="text-[#aaa]">
            Your selected files will be discarded. This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#3a3a3a] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-transparent border border-[#3a3a3a] text-[#aaa] rounded-md hover:border-[#667eea] hover:text-[#e0e0e0] transition-colors min-h-[44px]"
          >
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-[#dc3545] text-white rounded-md hover:bg-[#c82333] transition-colors min-h-[44px]"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

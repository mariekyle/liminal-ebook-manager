import React, { useState } from 'react';
import BookDetail from '../components/books/BookDetail';
import BookForm from '../components/books/BookForm';
import Modal from '../components/common/Modal';

const BookDetailPage = ({ 
  book, 
  onBack, 
  onEdit, 
  onDelete, 
  onDownload,
  onUpdateBook 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async (formData, coverFile) => {
    const result = await onUpdateBook(book.id, formData, coverFile);
    if (result.success) {
      setEditMode(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await onDelete(book.id);
    setShowDeleteModal(false);
    onBack();
  };

  if (editMode) {
    return (
      <BookForm
        book={book}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        onBack={() => setEditMode(false)}
      />
    );
  }

  return (
    <>
      <BookDetail
        book={book}
        onBack={onBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={onDownload}
      />
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Book"
        size="small"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete "{book.title}"?</p>
          <p>This action cannot be undone.</p>
          <div className="modal-actions">
            <button 
              className="btn btn-danger" 
              onClick={confirmDelete}
            >
              Delete
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BookDetailPage; 
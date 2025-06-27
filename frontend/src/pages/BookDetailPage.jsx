import React from 'react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import BookDetail from '../components/books/BookDetail';
import BookForm from '../components/books/BookForm';
import Modal from '../components/common/Modal';

const BookDetailPage = ({ 
  book, 
  onBack, 
  onUpdateBook, 
  onDelete, 
  onDownload 
}) => {
  const { state, actions } = useApp();
  const { actions: notificationActions } = useNotifications();
  const { settings } = useSettings();

  const handleEdit = () => {
    actions.setEditMode(true);
  };

  const handleCancelEdit = () => {
    actions.setEditMode(false);
  };

  const handleSaveEdit = async (formData, coverFile) => {
    const result = await onUpdateBook(book.id, formData, coverFile);
    if (result.success) {
      actions.setEditMode(false);
    }
  };

  const handleDelete = () => {
    if (settings.confirmDelete) {
      // Show confirmation modal
      notificationActions.showWarning(
        `Are you sure you want to delete "${book.title}"?`,
        {
          description: 'This action cannot be undone.',
          actions: [
            {
              label: 'Delete',
              action: () => confirmDelete(),
              variant: 'danger'
            },
            {
              label: 'Cancel',
              action: () => {},
              variant: 'secondary'
            }
          ]
        }
      );
    } else {
      confirmDelete();
    }
  };

  const confirmDelete = async () => {
    const result = await onDelete(book.id);
    if (result.success) {
      onBack();
    }
  };

  if (state.editMode) {
    return (
      <BookForm
        book={book}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        onBack={() => actions.setEditMode(false)}
      />
    );
  }

  return (
    <BookDetail
      book={book}
      onBack={onBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onDownload={onDownload}
    />
  );
};

export default BookDetailPage; 
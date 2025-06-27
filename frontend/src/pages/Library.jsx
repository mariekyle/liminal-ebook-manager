import React, { useState } from 'react';
import BookList from '../components/books/BookList';
import Loading from '../components/common/Loading';

const Library = ({ books, loading, onSelectBook, sortBy, onSortChange }) => {
  if (loading) {
    return <Loading fullScreen text="Loading your library..." />;
  }

  return (
    <BookList 
      books={books} 
      onSelectBook={onSelectBook} 
      sortBy={sortBy}
      onSortChange={onSortChange}
    />
  );
};

export default Library; 
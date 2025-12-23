/**
 * UploadZone.jsx
 * 
 * Initial upload screen with drag-and-drop zone and tips.
 */

import { useState, useCallback } from 'react';

export default function UploadZone({ onFileSelect, onFileDrop, fileInputRef }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    onFileDrop(e);
  }, [onFileDrop]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleInputChange = useCallback((e) => {
    if (e.target.files?.length > 0) {
      onFileSelect(e.target.files);
    }
  }, [onFileSelect]);

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-all duration-200 mb-6
          ${isDragging 
            ? 'border-[#667eea] bg-[#2f2f2f]' 
            : 'border-[#4a4a4a] bg-[#2a2a2a] hover:border-[#667eea] hover:bg-[#2f2f2f]'
          }
        `}
      >
        <div className="text-5xl mb-4">📚</div>
        <div className="text-base mb-2">
          {isDragging ? 'Drop files here' : 'Tap to select files'}
        </div>
        <div className="text-sm text-[#aaa]">
          EPUB • PDF • MOBI • AZW3 • HTML
        </div>
      </div>

      {/* Tips */}
      <div className="border-t border-[#3a3a3a] pt-5 mt-5">
        <h3 className="text-sm text-[#aaa] mb-3">Quick Tips</h3>
        <ul className="space-y-2">
          <Tip>Select all files at once</Tip>
          <Tip>Fanfic formats auto-group by title</Tip>
          <Tip>You can edit metadata before upload</Tip>
          <Tip>Duplicates detected automatically</Tip>
        </ul>
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <li className="text-sm text-[#aaa] pl-5 relative">
      <span className="absolute left-0 text-[#667eea]">•</span>
      {children}
    </li>
  );
}

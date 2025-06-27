export const validateFileType = (file, allowedTypes) => {
  if (!file) return false;
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file, maxSizeMB) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTag = (tag) => {
  return tag && tag.trim().length > 0 && tag.trim().length <= 50;
}; 
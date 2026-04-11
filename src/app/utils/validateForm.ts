export const validateForm = (title: string, optionsInput: string[]) => {
  const options = optionsInput.map((o) => o.trim()).filter((o) => o);
  
  if (!title.trim()) {
    return { valid: false, error: "Title is required" };
  }
  
  if (options.length === 0) {
    return { valid: false, error: "Options are required at least 1" };
  }
  
  return { valid: true, options };
};
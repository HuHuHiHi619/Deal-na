"use client";
import React, { useEffect } from "react";

interface OptionFormProps {
  options: string[];
  setOptions: (newOptions: string[]) => void;
  addOption: () => void;
}

function OptionForm({ options, setOptions, addOption }: OptionFormProps) {
  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 3) {
      addOption();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === options.length - 1 && options.length < 3) {
        handleAddOption();
      }
    }
  };
 

  return (
    <>
      <form action="">
        {options.map((option: string, index: number) => (
          <input
            key={index}
            type="text"
            value={option}
            className="border border-black text-black rounded-md p-2 mb-2"
            placeholder={`Option ${index + 1}`}
            onChange={(e) => handleOptionsChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            name="options"
          />
        ))}

        {options.length < 3 && (
          <button type="button" onClick={handleAddOption}>
            + ADD OPTION
          </button>
        )}
      </form>
    </>
  );
}

export default OptionForm;
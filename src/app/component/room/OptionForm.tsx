"use client";
import React from "react";

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
     <div>
    
      <form className="space-y-3">
        {options?.map((option: string, index: number) => (
          <div key={index} className="flex items-center  space-x-2">
            <input
              type="text"
              value={option}
              placeholder={`Add Option ${index + 1}`}
              onChange={(e) => handleOptionsChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              name="options"
             className="w-full px-4 py-3 bg-white shadow-lg  rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all duration-300"
            />
          </div>
        ))}

        {options?.length < 3 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="w-full  text-white py-3 rounded-xl font-medium bg-gradient-to-r from-rose-400 to-pink-400  transform hover:scale-[1.02] cursor-pointer transition-all duration-300 flex items-center justify-center space-x-2 "
          >
            <span>ADD OPTION</span>
          </button>
        )}
      </form>
    </div>
  );
}

export default OptionForm;

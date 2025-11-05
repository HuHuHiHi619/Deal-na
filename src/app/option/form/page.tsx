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
     <div className="w-full max-w-md bg-rose-200 rounded-2xl p-4 space-y-8">
      <div className="mb-2">
        <h2 className="text-xl text-center font-light text-rose-700 ">
          Add Voting Options
        </h2>
      </div>

      <form className="space-y-3">
        {options.map((option: string, index: number) => (
          <div key={index} className="flex items-center  space-x-2">
            <div className="flex-shrink-0 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
              <span className=" font-medium text-rose-600">
                {index + 1}
              </span>
            </div>
            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => handleOptionsChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              name="options"
              className="flex-1 px-2 py-3  border-2 border-rose-400 rounded-xl placeholder-rose-300 text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-all duration-300"
            />
          </div>
        ))}

        {options.length < 3 && (
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

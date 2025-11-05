import React from "react";
import OptionForm from "./form/page";
import { useRoomForm } from "../store/useRoomForm";

function OptionsPage() {
  const { titleInput, optionsInput, setOptionsInput, addOptionInput } =
    useRoomForm();

  return (
    <div className="flex  items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md bg-rose-100 rounded-2xl shadow-lg  p-4 md:p-12 space-y-8">
        <h1 className="text-2xl font-bold text-rose-700 mb-2">
          Voting Options
        </h1>
        <div className="inline-flex py-2 px-4  rounded-xl border-2 border-rose-400">
          <p className="text-lg text-rose-400">
            TOPIC:{" "}
            <span className="font-medium text-rose-600">{titleInput}</span>
          </p>
        </div>

        {/* Option Form Component */}
        <OptionForm
          options={optionsInput}
          setOptions={setOptionsInput}
          addOption={addOptionInput}
        />
      </div>
    </div>
  );
}

export default OptionsPage;

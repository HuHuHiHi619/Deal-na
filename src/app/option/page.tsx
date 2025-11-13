
import React from "react";
import { useRoomForm } from "../store/useRoomForm";
import { PlusCircle } from "lucide-react";
import OptionForm from "../component/room/OptionForm";

function OptionsPage() {
  const { titleInput, optionsInput, setOptionsInput, addOptionInput } =
    useRoomForm();

  return (
    <div className="flex  items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md bg-rose-100 rounded-2xl shadow-lg  p-4 md:p-8 space-y-8">
        <h1 className="flex items-center justify-center gap-3 text-xl font-bold text-center border-b pb-4 border-rose-200 text-rose-400 ">
          <PlusCircle />
          Give me an option
        </h1>
        <div className="flex justify-center">
          <p className="text-xl text-rose-400 font-bold text-center">
          {titleInput}
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

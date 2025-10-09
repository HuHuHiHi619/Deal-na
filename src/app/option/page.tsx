import React from "react";
import OptionForm from "./form/page";
import { useRoomForm } from "../store/useRoomForm";
// Import the new component

function OptionsPage() {
  const { titleInput, optionsInput, setOptionsInput, addOptionInput } =
    useRoomForm();

  return (
    <>
      <h1>Options Page</h1>
      <p>TOPIC IS: {titleInput}</p>

      {/* Pass the relevant props to the new component */}
      <OptionForm
        options={optionsInput} // Use optionsInput or myOwnOptions depending on your logic
        setOptions={setOptionsInput}
        addOption={addOptionInput}
      />
    </>
  );
}

export default OptionsPage;

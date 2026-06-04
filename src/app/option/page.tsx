"use client"
export const dynamic = 'force-dynamic';
import { useRoomFormContext } from "../room/RoomFormContext";
import OptionForm from "../component/room/OptionForm";

function OptionsPage() {
  const ctx = useRoomFormContext();
  if (!ctx) return null;
  const { optionsInput, setOptionsInput, addOptionInput, removeOptionInput } = ctx;

  return (
    <div className="flex flex-col gap-3">
      <p className="type-eyebrow text-muted">Options · {optionsInput.length}</p>

      <OptionForm
        options={optionsInput}
        setOptions={setOptionsInput}
        addOption={addOptionInput}
        removeOption={removeOptionInput}
      />
    </div>
  );
}

export default OptionsPage;

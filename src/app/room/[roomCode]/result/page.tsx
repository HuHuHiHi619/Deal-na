import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import React, { useMemo } from "react";

function page() {
  const { fetchOption, options } = useOptionStore();
  const { fetchVote, votes } = useVoteStore();

  const totalVotes = votes.length;

  const result = useMemo(() => {
    return options.map((option) => {
      const count = votes.filter((v) => v.option_id === option.id).length;
      const percentage = totalVotes === 0 ? 0 : (count / totalVotes) * 100;
      return { ...option, count, percentage };
    });
  }, [options, votes]);

  const maxVote = Math.max(...result.map((r) => r.count));
  const winners = result.filter((r) => r.count === maxVote);

  return (
    <div>
      {winners.length > 0 ? <p>WINNERS IS {winners.map(w => w.title).join(', ')}</p> : null}
      {result.map((item) => (
        <div key={item.id}>
          <p>{item.title}</p>
          <p>{item.count}</p>
          <p>{item.percentage}</p>
        </div>
      ))}
    </div>
  );
}

export default page;

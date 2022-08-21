import { useEffect, useState } from "react";

export function useContractEventLog(contract, filter, initBlockRange, skip) {
  const [logs, setLogs] = useState([]);
  const [fetched, setFetched] = useState(false);
  useEffect(() => {
    function handler(...args) {
      const event = args.pop();
      console.log(event)
      setLogs((prev) => [...prev, event]);
    }
    if (skip) return;
    contract.on(filter, handler);
    return () => contract.off(filter, handler);
  }, [contract, filter, skip]);
  useEffect(() => {
    if (skip || fetched) return;

    contract
      .queryFilter(filter, initBlockRange.from, initBlockRange.to)
      .then(setLogs)
      .then(() => setFetched(true));
  }, [contract, filter, initBlockRange, fetched, skip]);

  return logs;
}

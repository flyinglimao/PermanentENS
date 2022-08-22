import { useState } from "react";
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  Collapse,
  Grid,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  useAccount,
  useBlockNumber,
  useContract,
  useContractRead,
  useProvider,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useContractEventLog } from "./useContractEventLog";
import { Interface } from "ethers/lib/utils";
import moment from "moment";
import { useEffect } from "react";

const permanentEnsContract = {
  addressOrName: process.env.REACT_APP_CONTRACT,
  contractInterface: new Interface([
    "event NewConfig(bytes32 indexed label, address indexed payer, uint config_idx)",
    "event DisableConfig(bytes32 indexed label, address indexed payer, uint config_idx)",
    "event RenewedConfig(bytes32 indexed label, uint duration, uint new_expiry)",
    "function configs(bytes32 label, uint256 config_idx) external view returns (string name, address payer, uint256 max_duration, bool disabled)",
    "function disable(bytes32 label, uint256 config_idx) external",
  ]),
};
const ensContract = {
  addressOrName: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  contractInterface: new Interface([
    "function nameExpires(uint256 id) external view returns(uint)",
  ]),
};
function useBlockTime(block) {
  const provider = useProvider();
  const [time, setTime] = useState();
  useEffect(() => {
    if (block) provider.getBlock(block).then((e) => setTime(e.timestamp));
  }, [block, provider]);

  return time;
}
function ListItem({ label, idx, renewLogs }) {
  const [open, setOpen] = useState(false);
  const { data: configData, isLoading: configLoading } = useContractRead({
    ...permanentEnsContract,
    functionName: "configs",
    args: [label, idx],
  });
  const { data: ensData, isLoading: ensLoading } = useContractRead({
    ...ensContract,
    functionName: "nameExpires",
    args: [label],
  });
  const lastRenew = renewLogs.reverse().find((e) => e.args.label === label);
  const renewTime = useBlockTime(
    lastRenew ? lastRenew.blockNumber : 0
  );
  const { config } = usePrepareContractWrite({
    ...permanentEnsContract,
    functionName: "disable",
    args: [label, idx],
  });
  const { data, isLoading: isSending, write } = useContractWrite(config);
  const { isLoading: isProcessing } = useWaitForTransaction({
    hash: data && data.hash,
  });

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          {configLoading ? "Loading..." : configData.name + ".eth"}
        </TableCell>
        <TableCell align="right">
          <Button
            variant="outlined"
            size="small"
            disabled={!write || isSending || isProcessing}
            onClick={() => write()}
          >
            {isSending || isProcessing ? "Sending" : "Disable"}
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Grid container sx={{ margin: 1 }}>
              <Grid item xs={6}>
                Expiry:{" "}
                {!ensLoading && ensData
                  ? new Date(ensData.toNumber() * 1000).toLocaleString()
                  : "Loading..."}
                <br />
                Last Renewed:{" "}
                {lastRenew
                  ? renewTime
                    ? new Date(renewTime * 1000).toLocaleString()
                    : "Loading..."
                  : "N/A"}
              </Grid>
              <Grid item xs={6}>
                Max Duration:{" "}
                {configLoading
                  ? "Loading..."
                  : moment
                      .duration(configData.max_duration.toNumber() * 1000)
                      .humanize()}
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function RepayingList() {
  const { isConnected, address } = useAccount();
  const provider = useProvider();
  const contract = useContract(permanentEnsContract);
  const { data: blockNumber, isLoading } = useBlockNumber({ watch: false });
  const newConfigLogs = useContractEventLog(
    contract.connect(provider),
    contract.filters.NewConfig(null, address),
    {
      from: parseInt(process.env.REACT_APP_CONTRACT_DEPLOYED_BLOCKNUMBER),
      to: blockNumber,
    },
    isLoading
  );
  const disableConfigLogs = useContractEventLog(
    contract.connect(provider),
    contract.filters.DisableConfig(null, address),
    {
      from: parseInt(process.env.REACT_APP_CONTRACT_DEPLOYED_BLOCKNUMBER),
      to: blockNumber,
    },
    isLoading
  );
  const renewConfigLogs = useContractEventLog(
    contract.connect(provider),
    contract.filters.RenewedConfig(),
    {
      from: parseInt(process.env.REACT_APP_CONTRACT_DEPLOYED_BLOCKNUMBER),
      to: blockNumber,
    },
    isLoading
  );

  const repaying =
    newConfigLogs &&
    disableConfigLogs &&
    newConfigLogs
      .map((e) => e.args)
      .filter(
        (e, idx, array) =>
          array.findIndex(
            (f) =>
              f.label === e.label &&
              f.config_idx.toNumber() === e.config_idx.toNumber()
          ) === idx
      )
      .filter(
        (evt) =>
          !disableConfigLogs.some(
            (e) =>
              e.args.label === evt.label &&
              e.args.config_idx.toNumber() === evt.config_idx.toNumber()
          )
      );

  return (
    <Box
      sx={{
        height: isConnected ? undefined : 0,
        width: "800px",
        overflow: "hidden",
      }}
    >
      <Typography variant="h5" component="h2">
        Repaying
      </Typography>
      <TableContainer
        component={Box}
        size="small"
        sx={{ maxHeight: 400, overflow: "hidden auto" }}
      >
        <Table sx={{ width: 800 }}>
          <TableBody>
            {repaying.map((item) => (
              <ListItem
                key={`${item.label}-${item.config_idx}`}
                label={item.label}
                idx={item.config_idx}
                renewLogs={renewConfigLogs}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

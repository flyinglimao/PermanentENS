import { useState } from "react";
import {
  FormControl,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Button,
} from "@mui/material";
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { Interface, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { constants } from "ethers";

const ensContract = {
  addressOrName: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  contractInterface: new Interface([
    "function available(uint256 id) public view returns(bool)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
  ]),
};
const permanentEnsContract = {
  addressOrName: process.env.REACT_APP_CONTRACT,
  contractInterface: new Interface([
    "function enable(string calldata name, uint256 max_duration) external",
  ]),
};
const alchemistContract = {
  addressOrName: "0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd",
  contractInterface: new Interface([
    "function approveMint(address spender, uint256 amount) external",
    "function totalValue(address _owner) external view returns (uint)",
    "function mintAllowance(address, address) external view returns (uint)",
  ]),
};

export function CreateInput() {
  const { isConnected, address } = useAccount();
  const [name, setName] = useState("");
  const ensId = keccak256(toUtf8Bytes(name));

  const { data: available, isLoading } = useContractRead({
    ...ensContract,
    functionName: "available",
    args: [ensId],
  });
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useContractRead({
    ...alchemistContract,
    functionName: "mintAllowance",
    args: [address, process.env.REACT_APP_CONTRACT],
  });

  const { config } = usePrepareContractWrite({
    ...permanentEnsContract,
    functionName: "enable",
    args: [name, 86400 * 365 * 2],
  });
  const {
    data: enableTxData,
    isLoading: isWaitingEnable,
    write,
  } = useContractWrite(config);
  const { isLoading: isEnabling } = useWaitForTransaction({
    hash: enableTxData && enableTxData.hash,
  });

  const { config: approveMintConfig } = usePrepareContractWrite({
    ...alchemistContract,
    functionName: "approveMint",
    args: [process.env.REACT_APP_CONTRACT, constants.MaxUint256],
  });
  const {
    data: approveTxData,
    isLoading: isWaitingApprove,
    write: approve,
  } = useContractWrite(approveMintConfig);
  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveTxData && approveTxData.hash,
    onSettled() {
      refetchAllowance();
    },
  });

  const error =
    !isLoading && name.length && available
      ? `The domain hasn't been registered`
      : "";
  return (
    <FormControl sx={{ m: 1, width: "100%" }} error={!!error}>
      <OutlinedInput
        sx={{
          background: "rgba(255, 255, 255, .5)",
          "input::placeholder": {
            fontStyle: "italic",
          },
        }}
        value={name}
        onChange={(evt) => setName(evt.target.value)}
        endAdornment={
          <>
            <InputAdornment position="end">.eth</InputAdornment>
            {isConnected ? (
              allowance && allowance.eq(0) ? (
                <Button
                  variant="contained"
                  sx={{ marginLeft: "12px" }}
                  disabled={
                    !approve ||
                    isApproving ||
                    isWaitingApprove ||
                    isLoadingAllowance
                  }
                  onClick={() => {
                    approve();
                  }}
                >
                  {isApproving || isWaitingApprove ? "Sending..." : "Approve"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  sx={{ marginLeft: "12px" }}
                  disabled={
                    available ||
                    isLoading ||
                    !write ||
                    isWaitingEnable ||
                    isEnabling
                  }
                  onClick={() => {
                    write();
                  }}
                >
                  {isWaitingEnable || isEnabling ? "Sending..." : "Enable"}
                </Button>
              )
            ) : (
              <ConnectButton />
            )}
          </>
        }
        placeholder="Type in a domain you want to renew with Alchemix"
      />
      <FormHelperText>{!isLoading ? error : ""}&nbsp;</FormHelperText>
    </FormControl>
  );
}

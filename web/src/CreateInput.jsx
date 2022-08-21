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
} from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { Interface, keccak256, toUtf8Bytes } from "ethers/lib/utils";

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

export function CreateInput() {
  const { isConnected } = useAccount();
  const [name, setName] = useState("");
  const ensId = keccak256(toUtf8Bytes(name));
  const { data: available, isLoading } = useContractRead({
    ...ensContract,
    functionName: "available",
    args: [ensId],
  });
  const { config } = usePrepareContractWrite({
    ...permanentEnsContract,
    functionName: "enable",
    args: [name, 86400 * 365],
  });
  const { isLoading: isSending, write } = useContractWrite(config);

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
            <InputAdornment position="end">.ens</InputAdornment>
            {isConnected ? (
              <Button
                variant="contained"
                sx={{ marginLeft: "12px" }}
                disabled={available || isLoading || !write || isSending}
                onClick={() => {
                  write(name, 86400 * 365);
                }}
              >
                {isSending ? "Sending..." : "Enable"}
              </Button>
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

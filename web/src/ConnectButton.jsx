import { Button } from "@mui/material";
import { ConnectKitButton } from "connectkit";

export function ConnectButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnecting, show }) => {
        return (
          <Button
            variant="contained"
            sx={{ marginLeft: "12px" }}
            onClick={show}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting" : "Connect"}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}

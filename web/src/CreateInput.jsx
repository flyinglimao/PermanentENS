import { useState } from "react";
import {
  FormControl,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Button,
} from "@mui/material";

export function CreateInput() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <FormControl sx={{ m: 1, width: "100%" }} error={error.length}>
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
            <Button variant="contained" sx={{ marginLeft: "12px" }}>
              Connect
            </Button>
          </>
        }
        placeholder="Type in a domain you want to renew with Alchemix"
      />
      <FormHelperText>{error}</FormHelperText>
    </FormControl>
  );
}

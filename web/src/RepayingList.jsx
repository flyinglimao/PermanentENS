import { useState, useEffect } from "react";
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
import { useAccount } from "wagmi";

function ListItem() {
  const [open, setOpen] = useState(false);
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
        <TableCell>limao.eth</TableCell>
        <TableCell align="right">
          <Button variant="outlined" size="small">
            Disable
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Grid container sx={{ margin: 1 }}>
              <Grid item xs={6}>
                Expiry: 2032/03/12 15:33:32
                <br />
                Last Renewed: 2022/03/12 15:33:32
              </Grid>
              <Grid item xs={6}>
                Max Duration: 10 years
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function RepayingList() {
  const { isConnected } = useAccount();
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
            <ListItem />
            <ListItem />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

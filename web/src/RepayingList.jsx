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
import { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

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
  return (
    <Box
      sx={{
        width: "800px",
      }}
    >
      <Typography variant="h5" component="h2">
        Repaying
      </Typography>
      <TableContainer component={Box} size="small">
        <Table sx={{ width: 800 }}>
          <TableBody>
            <ListItem />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import styled from "@emotion/styled";
import { Container, Typography } from "@mui/material";
import { CreateInput } from "./CreateInput";
import { RepayingList } from "./RepayingList";

import "./App.css";

const Wrapper = styled(Container)`
  place-items: center;
  display: grid;
  place-items: center;
  padding: 30px 0;
  min-height: 100vh;
`;
const HeroDiv = styled.div`
  width: min-content;
  margin: 0 auto 30px;
`;

function App() {
  return (
    <div className="root">
      <Wrapper maxWidth="lg">
        <div>
          <HeroDiv>
            <Typography variant="h1">PermanentENS</Typography>
            <CreateInput />
          </HeroDiv>
          <RepayingList />
        </div>
      </Wrapper>
    </div>
  );
}

export default App;

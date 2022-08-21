import styled from "@emotion/styled";
import { Container, Typography } from "@mui/material";
import { CreateInput } from "./CreateInput";
import { RepayingList } from "./RepayingList";
import { WagmiConfig, createClient, configureChains, chain } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { ConnectKitProvider} from 'connectkit';
import { Buffer } from "buffer";

import "./App.css";

if (!window.Buffer) window.Buffer = Buffer;

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


const { chains, provider } = configureChains(
  [chain.mainnet, chain.hardhat],
  [
    infuraProvider(process.env.REACT_APP_INFURA),
    jsonRpcProvider({ rpc: () => process.env.REACT_APP_JSON_RPC }),
  ]
);
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "wagmi",
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
  ],

  provider,
});

function App() {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
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
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default App;

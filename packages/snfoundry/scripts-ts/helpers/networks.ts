import { RpcProvider, Account } from "starknet";
import path from "path";
import dotenv from "dotenv";
import { Networks } from "../types";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function createProvider(rpcUrl?: string) {
  return rpcUrl ? new RpcProvider({ nodeUrl: rpcUrl }) : undefined;
}

function createAccount(
  rpcUrl?: string,
  accountAddress?: string,
  privateKey?: string
) {
  if (!rpcUrl || !accountAddress || !privateKey) {
    return undefined;
  }

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  return new Account(provider, accountAddress, privateKey, "1");
}

// devnet
const RPC_URL_DEVNET = process.env.RPC_URL_DEVNET || "http://127.0.0.1:5050";
const ACCOUNT_ADDRESS_DEVNET = process.env.ACCOUNT_ADDRESS_DEVNET;
const PRIVATE_KEY_DEVNET = process.env.PRIVATE_KEY_DEVNET;

const providerDevnet = createProvider(RPC_URL_DEVNET);
const deployerDevnet = createAccount(
  RPC_URL_DEVNET,
  ACCOUNT_ADDRESS_DEVNET,
  PRIVATE_KEY_DEVNET
);

const ETH_TOKEN_ADDRESS_DEVNET =
  "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7";
const STRK_TOKEN_ADDRESS_DEVNET =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// sepolia
const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA;
const ACCOUNT_ADDRESS_SEPOLIA = process.env.ACCOUNT_ADDRESS_SEPOLIA;
const PRIVATE_KEY_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA;

const providerSepolia = createProvider(RPC_URL_SEPOLIA);
const deployerSepolia = createAccount(
  RPC_URL_SEPOLIA,
  ACCOUNT_ADDRESS_SEPOLIA,
  PRIVATE_KEY_SEPOLIA
);

const ETH_TOKEN_ADDRESS =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const STRK_TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// mainnet
const RPC_URL_MAINNET = process.env.RPC_URL_MAINNET;
const ACCOUNT_ADDRESS_MAINNET = process.env.ACCOUNT_ADDRESS_MAINNET;
const PRIVATE_KEY_MAINNET = process.env.PRIVATE_KEY_MAINNET;

const providerMainnet = createProvider(RPC_URL_MAINNET);
const deployerMainnet = createAccount(
  RPC_URL_MAINNET,
  ACCOUNT_ADDRESS_MAINNET,
  PRIVATE_KEY_MAINNET
);

const feeTokenOptions = {
  devnet: [
    { name: "eth", address: ETH_TOKEN_ADDRESS_DEVNET },
    { name: "strk", address: STRK_TOKEN_ADDRESS_DEVNET },
  ],
  mainnet: [
    { name: "eth", address: ETH_TOKEN_ADDRESS },
    { name: "strk", address: STRK_TOKEN_ADDRESS },
  ],
  sepolia: [
    { name: "eth", address: ETH_TOKEN_ADDRESS },
    { name: "strk", address: STRK_TOKEN_ADDRESS },
  ],
};

export const networks: Networks = {
  devnet: {
    provider: providerDevnet,
    deployer: deployerDevnet,
    feeToken: feeTokenOptions.devnet,
  },
  sepolia: {
    provider: providerSepolia,
    deployer: deployerSepolia,
    feeToken: feeTokenOptions.sepolia,
  },
  mainnet: {
    provider: providerMainnet,
    deployer: deployerMainnet,
    feeToken: feeTokenOptions.mainnet,
  },
};

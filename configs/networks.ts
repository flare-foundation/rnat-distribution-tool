import { NetworkContractAddresses } from "./contracts";
import * as dotenv from "dotenv";

dotenv.config();

const COSTON_CONFIG: NetworkContractAddresses = {
  RNat: { name: "RNat", address: "" }
};

const COSTON2_CONFIG: NetworkContractAddresses = {
  RNat: { name: "RNat", address: "0x221D27529e7788B929E13533edc3b00ec1ac5e8A" }
};

const SONGBIRD_CONFIG: NetworkContractAddresses = {
  RNat: { name: "RNat", address: "" }
};

const FLARE_CONFIG: NetworkContractAddresses = {
  RNat: { name: "RNat", address: "0x26d460c3Cf931Fb2014FA436a49e3Af08619810e" }
};

const COSTON_RPC = "https://coston-api.flare.network/ext/bc/C/rpc";
const COSTON2_RPC = "https://coston2-api.flare.network/ext/bc/C/rpc";
const SONGBIRD_RPC = "https://songbird-api.flare.network/ext/bc/C/rpc";
const FLARE_RPC = "https://flare-api.flare.network/ext/bc/C/rpc";

export type networks = "coston2" | "coston" | "songbird" | "flare";

const contracts = () => {
const network = process.env.NETWORK as networks;
  switch (network) {
    case "coston2":
      return COSTON2_CONFIG;
    case "coston":
      return COSTON_CONFIG;
    case "songbird":
      return SONGBIRD_CONFIG;
    case "flare":
      return FLARE_CONFIG;
    default:
      ((_: never): void => {})(network);
    }
};

const rpc = () => {
  const network = process.env.NETWORK as networks;
    switch (network) {
      case "coston2":
        return process.env.COSTON2_RPC || COSTON2_RPC;
      case "coston":
        return process.env.COSTON_RPC || COSTON_RPC;
      case "songbird":
        return process.env.SONGBIRD_RPC || SONGBIRD_RPC;
      case "flare":
        return process.env.FLARE_RPC || FLARE_RPC;
      default:
        ((_: never): void => {})(network);
      }
  };


export const CONTRACTS = contracts();
export const RPC = rpc();

export const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

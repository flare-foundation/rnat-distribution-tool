export type ContractAddress = string;

interface DistDefinition {
  name: "Dist";
  address: ContractAddress;
}
interface RNatDefinition {
  name: "RNat";
  address: ContractAddress;
}
export type ContractDefinitions =
  | DistDefinition
  | RNatDefinition;

export type ContractDefinitionsNames =
  | DistDefinition["name"]
  | RNatDefinition["name"]

export interface NetworkContractAddresses {
  Dist: DistDefinition;
  RNat: RNatDefinition;
}

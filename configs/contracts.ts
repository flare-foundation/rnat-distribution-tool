export type ContractAddress = string;

interface RNatDefinition {
  name: "RNat";
  address: ContractAddress;
}
export type ContractDefinitions =
  RNatDefinition;

export type ContractDefinitionsNames =
  RNatDefinition["name"]

export interface NetworkContractAddresses {
  RNat: RNatDefinition;
}

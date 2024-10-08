import Web3 from "web3";
import { CONTRACTS, RPC } from "../configs/networks";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import { waitFinalize, WaitFinalizeOptions } from "./utils/utils";
const parseCsv = require('csv-parse/lib/sync');
import { isAddress } from 'web3-validator';


dotenv.config();

if (!RPC) {
  throw new Error("NETWORK env variable is not set or is set to an unsupported network.");
}

const web3 = new Web3(RPC);

const rNatAbi = JSON.parse(readFileSync(`abi/RNat.json`).toString()).abi;
const rNat = new web3.eth.Contract(rNatAbi, CONTRACTS.RNat.address);

const waitFinalizeOptions: WaitFinalizeOptions = { extraBlocks: 2, retries: 3, sleepMS: 1000 };
const waitFinalize3 = waitFinalize(web3, waitFinalizeOptions);

let pending: number = 0;
let address2nonce: Map<string, number> = new Map();

export async function distributeRNat(filePath: string, month: number, showAssigned: boolean = false) {
  if (!process.env.PRIVATE_KEY || !process.env.PROJECT_ID) {
    throw new Error(
      "PRIVATE_KEY and PROJECT_ID env variables are required."
    );
  }

  if (month === undefined) {
    throw new Error("month is required.");
  }

  const wallet = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
  const projectId = process.env.PROJECT_ID;
  const data = await readCSV(filePath);

  const info = await rNat.methods.getProjectRewardsInfo(projectId, month).call();
  const assigned = BigInt(info[0]);
  const distributed = BigInt(info[1]);

  let amountToDistribute = BigInt(0);

  for (let i = 0; i < data.addresses.length; i++) {
    // check if address is valid
    if (!isAddress(data.addresses[i])) {
      throw new Error(`${data.addresses[i]} is not a valid address.`);
    }
    // check if amount is provided
    if (data.amounts[i] === "") {
      throw new Error(`Amount for address ${data.addresses[i]} is not provided.`);
    }
    amountToDistribute += BigInt(data.amounts[i]);
  }
  if (amountToDistribute + distributed > assigned) {
    throw new Error("Amount to distribute exceeds amount assigned for a given month.");
  }

  const projectInfo = await rNat.methods.getProjectInfo(projectId).call();
  const projectName = projectInfo[0];

  const batchSize = 50; // gas usage is at most 25k per address; 50 in batch is safe
  console.log(`Distributing rewards for project ${projectName} for month ${month}:`);
  for (let i = 0; i < data.addresses.length; i += batchSize) {
    const addressesBatch = data.addresses.slice(i, i + batchSize);
    const amountsBatch = data.amounts.slice(i, i + batchSize);
    const fnToEncode = rNat.methods.distributeRewards(projectId, month, addressesBatch, amountsBatch);
    await signAndFinalize3(wallet, rNat.options.address, fnToEncode);
    // await sleepms(2000);
  }

  // check rNat assigned for each address
  if (showAssigned) {
    console.log(`Assigned rewards for project ${projectName} for month ${month}:`)
    for (let i = 0; i < data.addresses.length; i++) {
      const info = await rNat.methods.getOwnerRewardsInfo(projectId, month, data.addresses[i]).call();
      console.log(`Address: ${data.addresses[i]} | Assigned: ${info[0]}`);
    }
  }
}

async function readCSV(filePath: string) {
  let rawData = fs.readFileSync(filePath, "utf8");
  let addresses: string[] = [];
  let amounts: string[] = [];
  parseCsv(rawData, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    skip_records_with_error: false,
    trim: true
  }).map(
    (row: any) => {
      addresses.push(row["recipient address"]);
      amounts.push(row["amount wei"]);
    }
  );
  let data = {
    addresses: addresses,
    amounts: amounts
  };
  return data;
}

async function signAndFinalize3(fromWallet: any, toAddress: string, fnToEncode: any) {
  const nonce = Number((await web3.eth.getTransactionCount(fromWallet.address)));
  // getBlockNumber sometimes returns a block beyond head block
  const lastBlock = await web3.eth.getBlockNumber() - 3n;
  // get fee history for the last 50 blocks
  let gasPrice: bigint;
  try {
    const feeHistory = await web3.eth.getFeeHistory(50, lastBlock, [0]);
    const baseFee = feeHistory.baseFeePerGas as any as bigint[];
    // get max fee of the last 50 blocks
    let maxFee = 0n;
    for (const fee of baseFee) {
      if (fee > maxFee) {
        maxFee = fee;
      }
    }
    gasPrice = maxFee * 2n;
  } catch (e) {
    gasPrice = await web3.eth.getGasPrice() * 2n;
  }

  const rawTX = {
    nonce: nonce,
    from: fromWallet.address,
    to: toAddress,
    gas: "8000000",
    gasPrice: gasPrice,
    data: fnToEncode.encodeABI()
  };
  const signedTx = await fromWallet.signTransaction(rawTX);

  try {
    pending++;
    console.log(`Send - pending: ${pending}, nonce: ${nonce}, from ${fromWallet.address}`);
    const receipt = await waitFinalize3(fromWallet.address, async () => web3.eth.sendSignedTransaction(signedTx.rawTransaction!));
    // console.log("gas used " + JSON.stringify(receipt.gasUsed, bigIntReplacer));
  } catch (e: any) {
    if ("innerError" in e && e.innerError != undefined && "message" in e.innerError) {
      console.log("from: " + fromWallet.address + " | to: " + toAddress + " | signAndFinalize3 error: " + e.innerError.message);
    } else if ("reason" in e && e.reason != undefined) {
      console.log("from: " + fromWallet.address + " | to: " + toAddress + " | signAndFinalize3 error: " + e.reason);
    } else {
      console.log(fromWallet.address + " | signAndFinalize3 error: " + e);
      console.dir(e);
    }
  }
}

import Web3 from "web3";
import { CONTRACTS, RPC } from "../configs/networks";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import { bigIntReplacer, waitFinalize3Factory } from "./utils/utils";
const parseCsv = require('csv-parse/lib/sync');

dotenv.config();

const web3 = new Web3(RPC);

const distAbi = JSON.parse(readFileSync(`abi/Dist.json`).toString()).abi;
const dist = new web3.eth.Contract(distAbi, CONTRACTS.Dist.address);
const rNatAbi = JSON.parse(readFileSync(`abi/RNat.json`).toString()).abi;
const rNat = new web3.eth.Contract(rNatAbi, CONTRACTS.RNat.address);

const waitFinalize3 = waitFinalize3Factory(web3);

let pending: number = 0;

export async function distribute(filePath: string) {
  if (!process.env.PRIVATE_KEY) {
    throw new Error(
      "PRIVATE_KEY env variable is required."
    );
  }

  let wallet = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  let data = await readCSV(filePath);
  const batchSize = 3;
  for (let i = 0; i < data.addresses.length; i += batchSize) {
    const addressesBatch = data.addresses.slice(i, i + batchSize);
    const amountsBatch = data.amounts.slice(i, i + batchSize);
    var fnToEncode = dist.methods.distribute(addressesBatch, amountsBatch);
    await signAndFinalize3(wallet, dist.options.address, fnToEncode);
  }
}

export async function distributeRNat(filePath: string, month: number) {
  if (!process.env.PRIVATE_KEY || !process.env.PROJECT_ID) {
    throw new Error(
      "PRIVATE_KEY and PROJECT_ID env variables are required."
    );
  }

  if (!month) {
    throw new Error("month is required.");
  }

  let wallet = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
  let projectId = process.env.PROJECT_ID;
  let data = await readCSV(filePath);

  let info = await rNat.methods.getProjectInfo(projectId).call();
  let assigned = info[2];
  let distributed = info[3];

  let amountToDistribute = BigInt(0);

  for (let i = 0; i < data.addresses.length; i++) {
    amountToDistribute += BigInt(data.amounts[i]);
  }
  if (amountToDistribute + distributed > assigned) {
    throw new Error("Amount to distribute exceeds assigned amount.");
  }

  const batchSize = 3;
  for (let i = 0; i < data.addresses.length; i += batchSize) {
    const addressesBatch = data.addresses.slice(i, i + batchSize);
    const amountsBatch = data.amounts.slice(i, i + batchSize);
    var fnToEncode = rNat.methods.distributeRewards(projectId, month, addressesBatch, amountsBatch);
    await signAndFinalize3(wallet, rNat.options.address, fnToEncode);
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
    skip_records_with_error: false
  }).map(
    (row: any) => {
      addresses.push(row.address);
      amounts.push(row.amount);
    }
  );
  let data = {
    addresses: addresses,
    amounts: amounts
  };
  return data;
}

async function signAndFinalize3(fromWallet: any, toAddress: string, fnToEncode: any) {
  let nonce = Number((await web3.eth.getTransactionCount(fromWallet.address)));
  let gasPrice = await web3.eth.getGasPrice();
  gasPrice = gasPrice * 150n / 100n;
  var rawTX = {
    nonce: nonce,
    from: fromWallet.address,
    to: toAddress,
    gas: "8000000",
    gasPrice: gasPrice.toString(), //"40000000000",
    data: fnToEncode.encodeABI()
  };
  var signedTx = await fromWallet.signTransaction(rawTX);

  try {
    pending++;
    console.log(`Send - pending: ${pending}, nonce: ${nonce}, from ${fromWallet.address}, to contract ${toAddress}`);
    let receipt = await waitFinalize3(fromWallet.address, async () => web3.eth.sendSignedTransaction(signedTx.rawTransaction!));
    console.log("gas used " + JSON.stringify(receipt.gasUsed, bigIntReplacer));
  } catch (e: any) {
    if ("innerError" in e && "message" in e.innerError) {
      console.log("from: " + fromWallet.address + " to: " + toAddress + " | signAndFinalize3 error: " + e.innerError.message);
    } else {
      console.log(fromWallet.address + " | signAndFinalize3 error: " + e);
      console.dir(e);
    }
  }
}
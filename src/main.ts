#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { distribute, distributeRNat } from './distribute';

// initialize configuration
dotenv.config();

let yargs = require('yargs');

let args = yargs
   .option('filePath', { alias: 'p', type: 'string', description: 'Path to the CSV file with rewarding data' })
   .option('month', { alias: 'm', type: 'number', description: 'Month for which rewards will be distributed' })
   .argv;


async function runDistribution() {

   let filePath = args['filePath'] ? args['filePath'] : 'rewards.csv';
   let month = args['month'];

// await distributeRNat(filePath, month);
   await distribute(filePath);
}

runDistribution()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });

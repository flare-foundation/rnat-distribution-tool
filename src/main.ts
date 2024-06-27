#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { distributeRNat } from './distribute';

dotenv.config();

let yargs = require('yargs');

let args = yargs
   .option('csvPath', { alias: 'p', type: 'string', description: 'Path to the CSV file with rewarding data' })
   .option('month', { alias: 'm', type: 'number', description: 'Month for which rewards will be distributed' })
   .argv;


async function runDistribution() {

   let filePath = args['filePath'] ? args['filePath'] : 'rewards-data.csv';
   let month = args['month'];

   await distributeRNat(filePath, month);
}

runDistribution()
   .then(() => process.exit(0))
   .catch((err) => {
      if (err instanceof Error) {
         console.log(`Error: ${err.message}`);
      }
   });
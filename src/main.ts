#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { distributeRNat } from './distribute';

dotenv.config();

let yargs = require('yargs');

let args = yargs
   .option('csvPath', { alias: 'p', type: 'string', description: 'Path to the CSV file with rewarding data' })
   .option('month', { alias: 'm', type: 'number', description: 'Month for which rewards will be distributed' })
   .option('showAssigned', { alias: 's', type: 'boolean', description: 'Show assigned rewards' })
   .argv;


async function runDistribution() {

   let filePath = args['csvPath'] ? args['csvPath'] : 'rewards-data.csv';
   let month = args['month'];
   let showAssigned = args['showAssigned'];

   await distributeRNat(filePath, month, showAssigned);
}

runDistribution()
   .then(() => process.exit(0))
   .catch((err) => {
      if (err instanceof Error) {
         console.log(`Error: ${err.message}`);
      }
   });
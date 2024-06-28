# RNat rewards distribution tool
Tool for distribution of rNat rewards.

##  Config file
Create an environment file (`.env`) with the following content (see [template](.env_template)):
- PROJECT_ID - ID of the project
- PRIVATE_KEY - Private key of the project's distributor
- NETWORK - Network on which to distribute rewards (flare/songbird/coston/coston2)
- Optionally one can set custom RPC endpoints for each network that will override the public ones (e.g. for Flare network one should set `FLARE_RPC=<private_rpc>`, for others use `SONGBIRD_RPC`, `COSTON_RPC`, `COSTON2_RPC`).

## Build the tool
- Clone the repo.
- Install dependencies:
```bash
yarn
```

## Add CSV file with rewards data
Create a CSV file named `rewards-data.csv` (see [example](rewards-data-example.csv)) with the following columns
- `recipient address` - address of the recipient
- `amount wei` - amount (in wei) of rNat to distribute to the recipient

and put it to the root of the project.


## Distribute rewards
To distribute rewards run the following command:
```bash
yarn distribute-rewards --month <month>
```
where `<month>` is the month for which the rewards should be distributed
(e.g. `yarn distribute-rewards --month 2`).

### Custom CSV path
One can also set custom path to the CSV file which will override the default one (`rewards-data.csv`):
```bash
yarn distribute-rewards --month <month> --csvPath <path-to-csv-file>
```
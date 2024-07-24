import Web3 from 'web3';

export function bigIntReplacer(key: string, value: any): any {
    if (typeof value === "bigint") {
        return value.toString() + "n";
    }
    return value;
}

export function waitFinalize3Factory(web3: Web3) {
    return async (address: string, func: () => any, delay: number = 1000) => {
        const nonce = await web3.eth.getTransactionCount(address);
        const res = await func();
        const backoff = 1.5;
        let cnt = 0;
        while ((await web3.eth.getTransactionCount(address)) === nonce) {
            await new Promise((resolve: any) => {
                setTimeout(() => {
                    resolve();
                }, delay);
            });
            if (cnt < 8) {
                delay = Math.floor(delay * backoff);
                cnt++;
            } else {
                throw new Error('Response timeout');
            }
            console.log(`Delay backoff ${delay} (${cnt})`);
        }
        return res;
    };
}

export class AmountError extends Error {
    constructor(address: string) {
        super(`Amount for address ${address} is not provided.`);
    }
}

export class AddressError extends Error {
    constructor(str: string) {
        super(`${str} is not a valid address.`);
    }
}

export async function sleepms(milliseconds: number) {
    await new Promise((resolve: any) => {
       setTimeout(() => {
          resolve();
       }, milliseconds);
    });
 }
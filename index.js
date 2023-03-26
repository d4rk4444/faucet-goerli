import { parseFile, timeout } from 'tools-d4rk444/other.js';
import { claimETHGoerli } from 'tools-d4rk444/faucet.js';
import chalk from 'chalk';
import consoleStamp from 'console-stamp';
import * as dotenv from 'dotenv';
dotenv.config();

consoleStamp(console, { format: ':date(HH:MM:ss)' });

(async() => {
    const wallet = parseFile('address.txt');
    const proxy = parseFile('proxy.txt');
    const acApi = process.env.AC_API;
    let status;

    while(true) {
        console.log(chalk.cyan('Start claim'));
        for (let i = 0; i < wallet.length; i++) {
            if (!proxy[i]) {
                console.log('Для этого кошелька нет прокси');
                process.exit;
            }
            console.log(chalk.yellow(`[${i+1}] Wallet: ${wallet[i]} / Proxy: ${proxy[i].split('@')[1]}`));
            status = false;
            while (true) {
                await claimETHGoerli(acApi, wallet[i], proxy[i]).then(function(res) {
                    if (res.status == 'false') {
                        if (res.msg == 'Please verify that you are not a robot.') {
                            console.log(chalk.yellow('Fail capcha, try again.'));
                        } else if (res.msg == 'There are a lot of requests at the moment, so please try again later.') {
                            console.log(chalk.yellow('There are a lot of requests at the moment, try again.'));
                        }
                    } else if (res.status == 'true') {
                        if (res.tx) {
                            status = true;
                            console.log(chalk.green(`CLAIM ${res.tx}`));
                        } else {
                            console.log(res);
                        }
                    } else if (res.status == 'limit') {
                        status = true;
                        console.log(chalk.bgRed('Этот прокси или кошелек уже клеймил сегодня. Перехожу к следующему прокси'));
                    }
                });
                if (status) break;
            }
        }
        console.log(chalk.yellow('Claim Cycle End'));
        await timeout(60000 * 60 * 10);
    }
})();
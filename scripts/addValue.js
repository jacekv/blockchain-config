const hre = require("hardhat");

const CONTRACT_ADDRESS = '0xA69e982Cc0da62e908181Ad212FdC50038C57417'

const KEY = hre.ethers.zeroPadValue("0x00", 32);
const FIELD_KEY = 1;
const VALUE = hre.ethers.zeroPadValue("0x01", 32);;

async function main() {
    const Config = await hre.ethers.getContractFactory('Config');
    const config = Config.attach(CONTRACT_ADDRESS);
    let tx = await config.updateConfigValue(KEY, FIELD_KEY, VALUE);
    console.log(tx.hash);
    await tx.wait();
    console.log('done');
}

main()
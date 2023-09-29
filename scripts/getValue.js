const hre = require("hardhat");

const CONTRACT_ADDRESS = '0xA69e982Cc0da62e908181Ad212FdC50038C57417'

const KEY = hre.ethers.zeroPadValue("0x00", 32);;
const FIELD_KEY = 1;

async function main() {
    const Config = await hre.ethers.getContractFactory('Config');
    const config = Config.attach(CONTRACT_ADDRESS);
    let value = Boolean(Number(await config.getRecordFieldValue(KEY, FIELD_KEY)));
    console.log('Value: ', value);
}

main()
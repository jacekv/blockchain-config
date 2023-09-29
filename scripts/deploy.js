const hre = require("hardhat");

async function main() {
    const config = await hre.ethers.deployContract('Config');
    await config.waitForDeployment();

    console.log(`Config deployed to ${config.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const daiAbi = require('../src/artifacts/contracts/DonationBox.sol/Erc20.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy


  // Mainnet addresses
  const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
  const cDaiAddress = "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643";

  const DonationBox = await hre.ethers.getContractFactory("DonationBox");
  // Replace the first address with the address of the admin user
  const donationBox = await DonationBox.deploy("0xa0df350d2637096571F7A701CBc1C5fdE30dF76A", daiAddress, cDaiAddress);
  


  await donationBox.deployed();
  console.log("DonationBox deployed to:", donationBox.address);


  // Uncomment these to add charities
  // const charity1 = "0xEC2DD0d0b15D494a58653427246DC076281C377a";
  // const charity2 = "0x5ACb5DB941E3Fc33E0c0BC80B90114b6CD0249B5";
  // await donationBox.addCharity(charity1);
  // console.log("Added charity ", charity1);
  // await donationBox.addCharity(charity2);
  // console.log("Added charity ", charity2);
  // const charities = await donationBox.getAllCharities();
  // console.log("all charities: ", charities);


  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

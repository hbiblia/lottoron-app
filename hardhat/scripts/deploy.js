const { ethers } = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  const ticketPrice = parseEther("1"); // 1 RON

  const LottoRon = await ethers.getContractFactory("LottoRon");
  const contrato = await LottoRon.deploy(ticketPrice); // si tu constructor lo necesita

  await contrato.waitForDeployment(); // ← reemplaza .deployed()

  console.log(`✅ LottoRon deployed at: ${contrato.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

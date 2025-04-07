const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [owner] = await ethers.getSigners();
  const contractAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  const contrato = await ethers.getContractAt("LottoRon", contractAddress);

  console.log("📊 Consultando balances...");

  const contractBalance = await ethers.provider.getBalance(contractAddress);
  console.log(`📦 Balance del contrato: ${ethers.formatEther(contractBalance)} RON`);

  const ownerBalance = await ethers.provider.getBalance(owner.address);
  console.log(`👑 Balance del owner (${owner.address}): ${ethers.formatEther(ownerBalance)} RON`);

  const investorList = await contrato.getAllInvestors();
  
  
  for (const address of investorList) {
    console.log(address);
    const info = await contrato.investors(address);
    const depositado = ethers.formatEther(info.amountDeposited);
    const rewards = ethers.formatEther(info.rewardsEarned);

    console.log(`\n👤 Inversor: ${address}`);
    console.log(`   - Depositado: ${depositado} RON`);
    console.log(`   - Recompensas acumuladas: ${rewards} RON`);
  }

  console.log("✅ Listo.");
}

main().catch((error) => {
  console.error("❌ Error en el script:", error);
  process.exitCode = 1;
});

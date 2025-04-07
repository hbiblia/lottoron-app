const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [owner] = await ethers.getSigners();

  // Dirección del contrato desplegado
  const contratoAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  const LottoRon = await ethers.getContractFactory("LottoRon");
  const contrato = await LottoRon.attach(contratoAddress);

  const currentId = await contrato.currentLotteryId();
  const currentLotto = await contrato.lottos(currentId);
  const now = Math.floor(Date.now() / 1000);

  if (now < Number(currentLotto.validUntil)) {
    console.log("⏳ Aún no ha terminado la ronda actual.");
    return;
  }

  const drawCooldownEnd = await contrato.drawCooldownEnd();
  if (now < Number(drawCooldownEnd)) {
    const waitTime = Number(drawCooldownEnd) - now;
    console.log(`🕒 Esperando ${waitTime}s para pasar cooldown...`);
    console.log("🕓 Sorteo cierra en:", new Date(Number(drawCooldownEnd) * 1000).toLocaleString());
    // await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
  }

  // Ejecutar el inicio de la nueva ronda
  const tx = await contrato.connect(owner).lotteryStartNextRound();
  await tx.wait();

  const newId = await contrato.currentLotteryId();
  console.log(`✅ Nueva ronda iniciada: Ronda #${newId}`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exitCode = 1;
});

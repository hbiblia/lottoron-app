const hre = require("hardhat");

const generateRandomNumbers = (count, min, max) => {
    const nums = new Set()
    while (nums.size < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min
      nums.add(String(num).padStart(2, '0'))
    }
    return [...nums]
}

async function main() {
  const [owner, player1, player2, investor1, investor2] = await hre.ethers.getSigners();

  // 👉 Dirección del contrato ya desplegado
  const contratoAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; // Reemplaza con la dirección real
  const LottoRon = await hre.ethers.getContractFactory("LottoRon");
  const contrato = LottoRon.attach(contratoAddress);

  // ─────────────────────────────────────────────────────────────
  // 1️⃣ Inversiones
  // ─────────────────────────────────────────────────────────────
  console.log("🔁 Inversores depositando...");

  await contrato.connect(investor1).invest({ value: hre.ethers.parseEther("2") });
  await contrato.connect(investor2).invest({ value: hre.ethers.parseEther("3") });

  console.log("✅ Inversiones completadas");

  // ─────────────────────────────────────────────────────────────
  // 2️⃣ Compra de tickets por jugadores
  // ─────────────────────────────────────────────────────────────
  
  try{
    console.log("🎟️ Jugadores comprando tickets...");
    for(let i = 0; i<100; i++){

        const ticketNumbers1 = generateRandomNumbers(6, 0, 39);
        
        await contrato.connect(player1).createTicket(ticketNumbers1, {
            value: hre.ethers.parseEther("1"),
        });

        console.log(`Numeros: ${ticketNumbers1}`);
    }

    console.log("✅ Tickets comprados");
}catch(error){
    console.log("❌ Ya no se puede comprar Tickets: ", error.message);
}

  // ─────────────────────────────────────────────────────────────
  // 3️⃣ Simulación de sorteo
  // ─────────────────────────────────────────────────────────────
  console.log("⏳ Esperando que la ronda expire...");

  const currentId = await contrato.currentLotteryId();
  const lotto = await contrato.lottos(currentId);
  const targetTime = lotto.validUntil;

  const waitTime = Number(targetTime) - Math.floor(Date.now() / 1000);

  if (waitTime > 0) {
    console.log(`⏳ Esperando ${waitTime}s para completar la ronda...`);
    console.log("🕓 Sorteo cierra en:", new Date(Number(targetTime) * 1000).toLocaleString());
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
  }

  try{
        contrato.once('LotteryCompleted', (numbers) => {
            console.log(`🎯 lotteryIsCompleted: ${numbers}`);
        })
      console.log("🎯 Ejecutando lotteryIsCompleted...");
      const tx = await contrato.connect(owner).lotteryIsCompleted();
      await tx.wait();
      console.log("✅ Sorteo completado");
      // ─────────────────────────────────────────────────────────────
      // 4️⃣ Reclamando recompensas de inversionistas
      // ─────────────────────────────────────────────────────────────
      console.log("💰 Inversores reclamando recompensas...");
      
      const rewards1 = await contrato.investors(investor1.address);
      const rewards2 = await contrato.investors(investor2.address);
      
      console.log("Investor 1 rewards:", hre.ethers.formatEther(rewards1.rewardsEarned));
      console.log("Investor 2 rewards:", hre.ethers.formatEther(rewards2.rewardsEarned));
      
      if (rewards1.rewardsEarned > 0n) {
          await contrato.connect(investor1).claimRewards();
          console.log("✅ Investor 1 cobró recompensas");
        }
        
        if (rewards2.rewardsEarned > 0n) {
            await contrato.connect(investor2).claimRewards();
            console.log("✅ Investor 2 cobró recompensas");
        }
    }catch(error){
        console.log("✅ Sorteo: ", error.message);
    }

}

main().catch((error) => {
  console.error("❌ Error en test-lotto.js:", error);
  process.exitCode = 1;
});

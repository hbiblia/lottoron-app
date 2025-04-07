const { ethers } = require("hardhat");

async function main() {
  const [owner, player1, player2] = await ethers.getSigners();

  const LottoRon = await ethers.getContractFactory("LottoRon");
  const lotto = await LottoRon.deploy();
  await lotto.waitForDeployment();

  console.log("✅ Contrato desplegado en:", lotto.target);

  // Fund contract
  await owner.sendTransaction({
    to: lotto.target,
    value: ethers.parseEther("10"),
  });

  // Crear tickets
  await lotto.connect(player1).createTicket([1, 2, 3, 4, 5, 6], {
    value: ethers.parseEther("1.0"),
  });
  
  await lotto.connect(player2).createTicket([1, 2, 3, 7, 8, 9], {
    value: ethers.parseEther("1.0"),
  });
  
  console.log("🎟️ Tickets creados");

  // Avanzar el tiempo 40 horas
//   await ethers.provider.send("evm_increaseTime", [40 * 3600]);
//   await ethers.provider.send("evm_mine");

  // Completar sorteo
    try{
        const tx = await lotto.connect(owner).lotteryIsCompleted();
        const result = await tx.wait();
        console.log("🏁 Sorteo completado");

        if (result.status)
        {
            // Avanzar tiempo y empezar nueva ronda
            await ethers.provider.send("evm_increaseTime", [2 * 60]);
            await ethers.provider.send("evm_mine");
            
            await lotto.connect(owner).lotteryStartNextRound();
            console.log("🔄 Nueva ronda iniciada");
        }
    }catch(error){}

  const balance = await ethers.provider.getBalance(lotto.target);
  console.log("💰 Balance del contrato:", ethers.formatEther(balance), "RON");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

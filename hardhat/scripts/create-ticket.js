const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"; // reemplaza con la real
  const [signer] = await ethers.getSigners(); // el wallet que llamará la función

  const contract = await ethers.getContractAt("LottoRon", contractAddress, signer);

  const tx = await contract.createTicket([1, 2, 3, 4, 5, 6], {
    value: ethers.parseEther("1") // si se requiere pagar 1 RON
  });

  await tx.wait();
  console.log("✅ Ticket creado");

  const [wallets, numbers, isWinners, createdAt, points] = await contract.getCurrentRoundTickets();
  console.log(`🎟️ Tickets actuales: ${wallets.length}`);
  wallets.forEach(async (wallet, i) => {
    console.log(`- ${wallet}:`, numbers[i], "🎯 Puntos:", points[i]);

    const tickers = await contract.getWinningTicketsByPlayer(wallet);
    console.log('Los Tickers ganadores del jugador: ',  tickers)
  });

  const balance = await ethers.provider.getBalance(contractAddress);
  console.log(`💰 El contrato tiene: ${ethers.formatEther(balance)} RON`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

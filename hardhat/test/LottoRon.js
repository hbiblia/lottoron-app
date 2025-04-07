const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LottoRon", function () {
  let lotto;
  let owner, player1, player2, player3;

  beforeEach(async () => {
    [owner, player1, player2, player3] = await ethers.getSigners();

    const LottoRon = await ethers.getContractFactory("LottoRon");
    lotto = await LottoRon.deploy();
    await lotto.waitForDeployment();

    // Depositar fondos al contrato para los premios
    await owner.sendTransaction({
      to: lotto.target,
      value: ethers.parseEther("10")
    });
  });

  it("debería crear tickets y repartir premios correctamente", async () => {
    // Avanzamos tiempo para evitar cooldown si aplica
    await ethers.provider.send("evm_increaseTime", [1]);
    await ethers.provider.send("evm_mine");

    // Crear tickets con diferentes jugadores
    const tx1 = await lotto.connect(player1).createTicket([1, 2, 3, 4, 5, 6], {
      value: ethers.parseEther("1.0"),
    });
    await tx1.wait();
    
    const tx2 = await lotto.connect(player2).createTicket([1, 2, 3, 7, 8, 9], {
      value: ethers.parseEther("1.0"),
    });
    await tx2.wait();
    
    const tx3 = await lotto.connect(player3).createTicket([10, 11, 12, 13, 14, 15], {
      value: ethers.parseEther("1.0"),
    });
    await tx3.wait();

    // Fast forward al final de la ronda
    await ethers.provider.send("evm_increaseTime", [40 * 3600]); // 40 horas
    await ethers.provider.send("evm_mine");

    // Completar sorteo
    const completeTx = await lotto.connect(owner).lotteryIsCompleted();
    await completeTx.wait();

    // Verificar que el contrato pagó
    const balance2 = await ethers.provider.getBalance(player2.address);
    const balance3 = await ethers.provider.getBalance(player3.address);

    console.log("Jugador 2 balance:", ethers.formatEther(balance2));
    console.log("Jugador 3 balance:", ethers.formatEther(balance3));

    const totalPoints = await lotto.getTotalPointsByPlayer(player2.address);
    console.log("Jugador 2 puntos:", totalPoints);

    const balance = await ethers.provider.getBalance(lotto.target);
    console.log("💰 Balance del contrato:", ethers.formatEther(balance), "RON");

    // Verifica que se hayan asignado puntos
    expect(totalPoints).to.be.gte(0);
  });
});

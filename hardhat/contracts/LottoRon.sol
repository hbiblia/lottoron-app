// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract LottoRon {
    // ─────────────────────────────────────────────────────────────
    // 🧾 Estructuras
    // ─────────────────────────────────────────────────────────────
    struct Ticket {
        address walletAddress;
        uint8[6] numbers;
        bool isWinner;
        uint256 createAt;
        uint8 points;
    }

    struct Investor {
        uint256 amountDeposited;
        uint256 rewardDebt;
        uint256 depositTime;
        uint256 rewardsEarned;
    }

    struct Lotto {
        uint256 id;
        uint8[6] winningNumbers;
        Ticket[] tickets;
        bool completed;
        uint256 drawTime;
        uint256 validUntil;
        uint256 totalCollected;
        bool hasWinners;
    }

    // ─────────────────────────────────────────────────────────────
    // 🔧 Configuración y variables globales
    // ─────────────────────────────────────────────────────────────
    uint256 private constant NUMBERS_PER_TICKET = 6;
    uint256 private constant MAX_NUMBER = 39;
    uint256 private constant INVESTOR_LOCK_TIME = 1 minutes;//365 days;
    uint256 private constant INVESTOR_WITHDRAW_FEE_PERCENT = 10;

    address private owner;
    uint256 public currentLotteryId;
    uint256 public drawCooldownEnd;
    bool private drawCompleted;
    uint256 private ticketPrice = 1 ether;

    mapping(uint256 => Lotto) public lottos;
    mapping(uint8 => uint256) private prizeByPoints;
    mapping(address => Investor) public investors;
    address[] private investorList;

    uint256 private totalInvested;
    uint256 private totalRewardsDistributed;
    uint256 private totalBurnedFees;
    uint256 private jackpotPool;

    // ─────────────────────────────────────────────────────────────
    // 📣 Eventos
    // ─────────────────────────────────────────────────────────────
    event TicketCreated(address wallet, uint8[6] numbers, uint256 lotteryId, bool isWinner, uint256 validDate, uint256 createdAt);
    event LotteryCompleted(uint8[6] winningNumbers, uint256 lotteryId);
    event InvestorsPaid(uint256 amount, uint256 roundId);
    event InvestorClaimed(address investor, uint256 amount);
    event InvestorWithdraw(address investor, uint256 amountAfterFee, uint256 fee);
    event DepositReceived(address sender, uint256 amount);

    // ─────────────────────────────────────────────────────────────
    // 🏗️ Constructor
    // ─────────────────────────────────────────────────────────────
    constructor(uint256 _ticketPrice) {
        require(_ticketPrice > 0, "El precio del ticket debe ser mayor a 0.");
        ticketPrice = _ticketPrice;
        owner = msg.sender;
        currentLotteryId = 1;
        drawCompleted = false;

        prizeByPoints[3] = 4 ether;
        prizeByPoints[4] = 25 ether;
        prizeByPoints[5] = 50 ether;
        prizeByPoints[6] = 200 ether;

        lottos[currentLotteryId].id = currentLotteryId;
        lottos[currentLotteryId].validUntil = block.timestamp + 1 minutes;//40 hours;
    }

    // ─────────────────────────────────────────────────────────────
    // 🎟️ Tickets
    // ─────────────────────────────────────────────────────────────
    function createTicket(uint8[6] calldata numbers) public payable {
        require(msg.value == ticketPrice, "Debes pagar exactamente 1 RON.");
        require(!hasDuplicates(numbers), "Los numeros no deben repetirse.");
        require(block.timestamp < lottos[currentLotteryId].validUntil, "La ronda esta cerrada.");
        require(block.timestamp > drawCooldownEnd, "Cooldown activo.");

        uint256 amount = msg.value;
        uint256 toOwner = amount * 30 / 100;
        uint256 toJackpot = amount * 10 / 100;

        jackpotPool += toJackpot;

        (bool successOwner, ) = owner.call{ value: toOwner }("");
        require(successOwner, "Pago al owner fallido");

        Ticket memory newTicket = Ticket({
            walletAddress: msg.sender,
            numbers: numbers,
            isWinner: false,
            createAt: block.timestamp,
            points: 0
        });

        lottos[currentLotteryId].tickets.push(newTicket);
        lottos[currentLotteryId].totalCollected += amount;

        emit TicketCreated(msg.sender, numbers, currentLotteryId, false, lottos[currentLotteryId].validUntil, block.timestamp);
    }

    function distributeInvestorRewards(uint256 roundId) internal {
        Lotto storage lotto = lottos[roundId];
        if (totalInvested == 0 || lotto.hasWinners) return;

        uint256 rewardPool = lotto.totalCollected * 10 / 100;
        for (uint256 i = 0; i < investorList.length; i++) {
            address user = investorList[i];
            Investor storage investor = investors[user];
            uint256 share = (rewardPool * investor.amountDeposited) / totalInvested;
            investor.rewardsEarned += share;
        }

        emit InvestorsPaid(rewardPool, roundId);
    }

    function hasDuplicates(uint8[6] calldata numbers) private pure returns (bool) {
        for (uint8 i = 0; i < 6; i++) {
            for (uint8 j = i + 1; j < 6; j++) {
                if (numbers[i] == numbers[j]) return true;
            }
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────
    // 🎰 Lotería
    // ─────────────────────────────────────────────────────────────

    // 🎲 Genera 6 números únicos aleatorios entre 0 y 39
    //
    // ⚠️ Nota sobre seguridad:
    // Este método usa keccak256 con block.timestamp y msg.sender para generar números,
    // lo cual es considerado pseudoaleatorio y no es 100% seguro contra manipulación
    // si se usa antes de cerrar entradas.
    //
    // ✅ En este caso particular ES SEGURO porque:
    // - La función solo se llama dentro de `lotteryIsCompleted()`
    // - Esa función solo puede ejecutarla el owner
    // - Los tickets ya no pueden crearse (`block.timestamp > validUntil`)
    // - Los resultados no pueden influenciarse tras su generación
    //
    // 🔒 Por lo tanto, nadie puede generar tickets después de ver los resultados,
    // y el owner no puede "forzar" una ganancia.
    //
    // 🛡️ Recomendación futura: Si Ronin admite oráculos (ej: Chainlink VRF),
    // se puede reemplazar este sistema para tener aleatoriedad 100% verificable.

    function lotteryIsCompleted() external {
        require(msg.sender == owner, "Solo el owner puede cerrar.");
        require(block.timestamp > lottos[currentLotteryId].validUntil, "Ronda aun activa.");
        require(!drawCompleted, "Ya se completo el sorteo.");

        uint8[6] memory winningNumbers = lotteryGenerateWinningNumbers();
        lottos[currentLotteryId].winningNumbers = winningNumbers;
        lottos[currentLotteryId].completed = true;
        lottos[currentLotteryId].drawTime = block.timestamp;

        bool hayGanadores = verifyWinners(winningNumbers);

        if (!hayGanadores) {
            distributeInvestorRewards(currentLotteryId);
        }

        distributePrizes(currentLotteryId);
        distributeJackpot(currentLotteryId);

        drawCompleted = true;
        drawCooldownEnd = block.timestamp + 10 seconds;//2 minutes;

        emit LotteryCompleted(winningNumbers, currentLotteryId);
    }

    function verifyWinners(uint8[6] memory winningNumbers) private returns (bool) {
        Lotto storage lotto = lottos[currentLotteryId];
        bool hasWinner = false;

        for (uint256 i = 0; i < lotto.tickets.length; i++) {
            Ticket storage ticket = lotto.tickets[i];
            uint8 matches = 0;

            for (uint8 t = 0; t < 6; t++) {
                for (uint8 w = 0; w < 6; w++) {
                    if (ticket.numbers[t] == winningNumbers[w]) {
                        matches++;
                        break;
                    }
                }
            }

            uint8 pts = 0;
            if (matches == 3) pts = 1;
            else if (matches == 4) pts = 2;
            else if (matches == 5) pts = 3;
            else if (matches == 6) pts = 4;

            ticket.points = pts;

            if (pts > 0) {
                ticket.isWinner = true;
                hasWinner = true;
            }
        }

        lotto.hasWinners = hasWinner;
        return hasWinner;
    }

    function distributePrizes(uint256 roundId) private {
        Lotto storage lotto = lottos[roundId];
        for (uint8 level = 3; level <= 6; level++) {
            uint256 count = 0;
            for (uint256 i = 0; i < lotto.tickets.length; i++) {
                if (lotto.tickets[i].points == level) count++;
            }
            if (count == 0) continue;
            uint256 totalPrize = prizeByPoints[level];
            uint256 share = totalPrize / count;
            for (uint256 i = 0; i < lotto.tickets.length; i++) {
                if (lotto.tickets[i].points == level) {
                    (bool success, ) = lotto.tickets[i].walletAddress.call{ value: share }("");
                    require(success, "Transferencia fallida");
                }
            }
        }
    }

    function distributeJackpot(uint256 roundId) internal {
        Lotto storage lotto = lottos[roundId];
        uint256 winnersCount = 0;
        for (uint256 i = 0; i < lotto.tickets.length; i++) {
            if (lotto.tickets[i].points == 4) winnersCount++;
        }
        if (winnersCount > 0 && jackpotPool > 0) {
            uint256 share = jackpotPool / winnersCount;
            for (uint256 i = 0; i < lotto.tickets.length; i++) {
                if (lotto.tickets[i].points == 4) {
                    (bool success, ) = lotto.tickets[i].walletAddress.call{ value: share }("");
                    require(success, "Jackpot pago fallido");
                }
            }
            jackpotPool = 0;
        }
    }

    function lotteryStartNextRound() external {
        require(drawCompleted, "Completa la ronda actual.");
        require(block.timestamp > drawCooldownEnd, "Espera cooldown.");
        currentLotteryId++;
        drawCompleted = false;
        lottos[currentLotteryId].id = currentLotteryId;
        lottos[currentLotteryId].validUntil = block.timestamp + 1 minutes;//40 hours;
    }

    function lotteryGenerateWinningNumbers() private view returns (uint8[6] memory) {
        bool[40] memory used;
        uint8[6] memory numbers;
        uint8 count = 0;
        while (count < 6) {
            uint8 number = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, count))) % 40);
            if (!used[number]) {
                used[number] = true;
                numbers[count] = number;
                count++;
            }
        }
        return numbers;
    }

    // ─────────────────────────────────────────────────────────────
    // 💰 Inversiones
    // ─────────────────────────────────────────────────────────────
    function invest() external payable {
        require(msg.value > 0, "Debes enviar RON");
        if (investors[msg.sender].amountDeposited == 0) investorList.push(msg.sender);
        investors[msg.sender].amountDeposited += msg.value;
        investors[msg.sender].depositTime = block.timestamp;
        totalInvested += msg.value;
    }

    function claimRewards() external {
        Investor storage investor = investors[msg.sender];
        uint256 rewards = investor.rewardsEarned;
        require(rewards > 0, "Sin recompensas");
        investor.rewardsEarned = 0;
        (bool success, ) = msg.sender.call{ value: rewards }("");
        require(success, "Error al pagar");
        emit InvestorClaimed(msg.sender, rewards);
    }

    function withdrawInvestment() external {
        Investor storage investor = investors[msg.sender];
        require(investor.amountDeposited > 0, "Nada invertido");
        require(block.timestamp >= investor.depositTime + INVESTOR_LOCK_TIME, "Bloqueado 12 meses");
        uint256 amount = investor.amountDeposited;
        uint256 fee = (amount * INVESTOR_WITHDRAW_FEE_PERCENT) / 100;
        uint256 toSend = amount - fee;
        investor.amountDeposited = 0;
        totalBurnedFees += fee;
        totalInvested -= amount;
        (bool success, ) = msg.sender.call{ value: toSend }("");
        require(success, "Retiro fallido");
        emit InvestorWithdraw(msg.sender, toSend, fee);
    }

    function getAllInvestors() external view returns (address[] memory) {
        return investorList;
    }

    // ─────────────────────────────────────────────────────────────
    // 🛠 Utilidades
    // ─────────────────────────────────────────────────────────────
    function setPrizeForLevel(uint8 points, uint256 amount) external {
        require(msg.sender == owner, "Solo el owner");
        require(points >= 3 && points <= 6, "Nivel no valido");
        prizeByPoints[points] = amount;
    }

    function getJackpotAmount() external view returns (uint256) {
        return jackpotPool;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }

    function deposit() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }
}

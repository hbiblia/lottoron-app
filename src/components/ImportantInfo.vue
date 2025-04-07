<template>
  <div class="flex flex-col items-center justify-center w-full py-10 px-6">
    <div
      class="bg-white dark:bg-[#1e1e1e] shadow-lg rounded-2xl p-8 max-w-xl w-full text-center border border-yellow-400"
    >
      <h1 class="text-3xl font-extrabold mb-4 text-yellow-500">
        📌 Important Information
      </h1>

      <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Welcome to
        <span class="font-semibold text-yellow-500">lotto-$ron</span>, a
        blockchain-based lottery system. Below you’ll find important technical
        details and progress updates.
      </p>

      <!-- GitHub Link -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          🔗 Project Repository
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          All of the code powering this app — frontend, backend, and smart
          contracts — is open source and fully visible to anyone.
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          You can explore it, suggest improvements, or fork your own version on
          GitHub:
        </p>
        <a
          href="https://github.com/hbiblia/lottoron-app"
          target="_blank"
          class="text-blue-500 underline hover:text-blue-400 transition"
        >
          github.com/hbiblia/lottoron-app
        </a>
      </div>

      <!-- Smart Contract Status -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          🧪 Smart Contract Status
        </h2>
        <div
          class="inline-block px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-sm font-semibold"
        >
          Currently in Testing Phase
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          The smart contract is currently under testing on a testnet
          environment. Once finalized, it will:
        </p>
        <ul
          class="text-sm text-gray-600 dark:text-gray-400 mt-2 list-disc list-inside text-left"
        >
          <li>🧮 Generate the winning lottery numbers on-chain.</li>
          <li>✅ Perform final ticket validation directly on-chain.</li>
          <li>🏦 Ensure complete transparency and security for all draws.</li>
        </ul>
      </div>

      <!-- Serverless Info -->
      <div>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
          ⚙️ Serverless Backend (Current)
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          While the contract is being finalized, the system is using serverless
          functions to:
        </p>
        <ul
          class="text-sm text-gray-600 dark:text-gray-400 mt-2 list-disc list-inside text-left"
        >
          <li>🔍 Verify payments made by users.</li>
          <li>
            💸 Distribute
            <span class="font-bold text-yellow-500">$ron</span> tokens
            automatically.
          </li>
        </ul>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          These functions ensure secure operation during the testing phase and
          will be gradually replaced by full on-chain logic.
        </p>
      </div>
    </div>
  </div>
</template>

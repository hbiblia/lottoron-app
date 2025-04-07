<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTicketStore } from '@/stores/ticketStore'
import { useWalletStore } from '@/stores/walletStore'
import { useLotteryStore } from '@/stores/lotteryStore'
import { useWalletTransferStore } from './WalletTransfer/stores'

// Store for opening the Wallet Transfer component/modal
const { WalletTransferOpen } = useWalletTransferStore()

// Ticket-related functions and reactive references
const ticketStore = useTicketStore()
const { generateTicket, generateCustomTicket } = ticketStore
const { errorMessage } = storeToRefs(ticketStore)

// Wallet-related functions and reactive references
const walletStore = useWalletStore()
const { connectWallet, walletIsConnect } = walletStore
const { isWalletVerified } = storeToRefs(walletStore)

// Lottery availability state
const lotteryStore = useLotteryStore()
const { lotteryAvailable } = storeToRefs(lotteryStore)

// State to switch between auto and manual ticket mode
const manualMode = ref(false)
// Stores custom numbers entered by the user
const customNumbers = ref(Array(6).fill(''))

/**
 * Handles the ticket generation.
 * If manual mode is enabled and numbers are valid, it generates a custom ticket.
 * Otherwise, generates a random ticket.
 * If ticket generation is successful, it opens the WalletTransfer modal.
 */
const handleGenerate = () => {
    let ticketsNumbers = null;
    errorMessage.value = ''

    if (manualMode.value) {
        if (customNumbers.value.every(num => /^\d{1,2}$/.test(num))) {
            ticketsNumbers = generateCustomTicket([...customNumbers.value])
            customNumbers.value = Array(6).fill('')
            manualMode.value = false
        } else {
            customNumbers.value = Array(6).fill('')
            errorMessage.value = 'All numbers must be between 0 and 39'
        }
    } else {
        ticketsNumbers = generateTicket()
    }

    if (ticketsNumbers) {
        WalletTransferOpen(true, { ticketsNumbers })
    }
}

/**
 * Closes the manual number selection modal and resets state.
 */
const closeModal = () => {
    customNumbers.value = Array(6).fill('')
    manualMode.value = false
}

// Automatically check wallet connection when component is mounted
onMounted(async () => {
    await walletIsConnect()
})
</script>

<template>
    <div class="flex flex-wrap items-center gap-3 mt-4">
        <!-- Message when no lottery is available -->
        <div v-if="isWalletVerified && !lotteryAvailable"
            class="text-center text-sm text-red-500 bg-red-100 dark:bg-red-200 dark:text-red-800 rounded-md px-4 py-2 mb-4 w-6/12 inset-x-0 m-auto">
            <h2>
                There is currently no active draw. The next ticket purchase round will begin 2 minutes after the winning
                numbers are announced.
            </h2>
        </div>

        <!-- Button to connect the wallet -->
        <div v-if="!isWalletVerified">
            <button @click="connectWallet"
                class="bg-blue-500 hover:bg-blue-600 active:bg-blue-300 text-white font-semibold px-4 py-2 rounded-xl cursor-pointer motion-preset-bounce">
                🔐 Connect Wallet
            </button>
        </div>

        <!-- Button to enter numbers manually -->
        <button v-if="isWalletVerified && lotteryAvailable" @click="manualMode = true"
            class="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-xl shadow-sm transition cursor-pointer">
            <span class="hidden sm:block">✏️</span>
            <span>Pick Numbers</span>
        </button>

        <!-- Button to generate random ticket -->
        <button v-if="isWalletVerified && lotteryAvailable" @click="handleGenerate"
            class="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-xl shadow-sm transition cursor-pointer">
            <span class="hidden sm:block">🎲</span>
            <span>Random Ticket</span>
        </button>
    </div>

    <!-- Manual number input modal -->
    <div v-if="manualMode" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-neutral-900 text-black dark:text-white p-6 rounded-lg shadow-lg w-[380px]">
            <span class="text-base">All numbers must be between 0 and 39</span>
            <h2 class="text-lg text-center font-bold mb-4">
                Select 6 numbers
            </h2>

            <div class="grid grid-cols-3 gap-2 mb-4">
                <input type="number" min="0" max="39" v-for="(num, i) in customNumbers" :key="i"
                    v-model="customNumbers[i]" maxlength="2"
                    class="w-20 h-12 text-center text-lg rounded bg-white text-black dark:bg-neutral-100 font-bold border border-yellow-400"
                    placeholder="00" />
            </div>

            <p v-if="errorMessage" class="text-red-500 text-sm text-center mb-2">
                {{ errorMessage }}
            </p>

            <div class="flex justify-end gap-2">
                <button @click="closeModal"
                    class="text-sm px-3 py-1 bg-gray-200 dark:bg-neutral-700 rounded hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="handleGenerate"
                    class="text-sm px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded font-semibold">
                    Generate
                </button>
            </div>
        </div>
    </div>
</template>

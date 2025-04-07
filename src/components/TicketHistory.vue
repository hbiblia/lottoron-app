<script setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTicketStore } from '@/stores/ticketStore'
import { useWalletStore } from '@/stores/walletStore'
import { useLotteryStore } from '@/stores/lotteryStore'
import LotteryHistoryTable from './LotteryHistoryTable.vue'
import uiSpinner from './uiSpinner.vue'

// Ticket store: retrieves user ticket data
const ticketStore = useTicketStore()
const { getTickets } = ticketStore
const { tickets } = storeToRefs(ticketStore)

// Wallet store: checks if the user's wallet is verified
const walletStore = useWalletStore()
const { isWalletVerified } = storeToRefs(walletStore)

// Lottery store (not directly used here but available if needed)
const lotteryStore = useLotteryStore()
const { lotteryAvailable } = storeToRefs(lotteryStore)

// Loading state for ticket fetch
const isLoading = ref(false)

/**
 * On component mount, fetch the user's tickets
 * and set loading to true once data is retrieved.
 */
onMounted(async () => {
    await getTickets()
    isLoading.value = true
})
</script>

<template>
    <!-- Loading spinner shown while fetching tickets -->
    <div class="flex flex-col items-center gap-4 mt-2 w-full mb-10" v-if="!isLoading">
        <uiSpinner />
    </div>

    <!-- Message shown if user has no tickets -->
    <div v-if="tickets.length == 0 && isLoading"
        class="text-center text-sm text-red-500 bg-red-200 dark:bg-orange-200 dark:text-red-800 rounded-md px-4 py-2 my-5">
        ‼️ You currently have no tickets
    </div>

    <!-- Ticket history table -->
    <div class="flex flex-col items-center gap-4 mt-2 w-full mb-10">
        <template v-if="isWalletVerified && isLoading">
            <LotteryHistoryTable />
        </template>
    </div>
</template>

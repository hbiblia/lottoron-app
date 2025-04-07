<script setup>
import { ref, watchEffect, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { storeToRefs } from 'pinia'
import { useTicketStore } from '@/stores/ticketStore'
import { useWalletStore } from '@/stores/walletStore'
import { useWalletTransferStore } from '@/components/WalletTransfer/stores'

import WalletTransfer from '@/components/WalletTransfer/WalletTransfer.vue'
import TicketHistory from '@/components/TicketHistory.vue'
import HowToWin from '../components/HowToWin.vue'
import PlayerList from '../components/PlayerList.vue'
import ImportantInfo from '../components/ImportantInfo.vue'

// Wallet destination (e.g., game's treasury)
const mywallet = import.meta.env.VITE_WALLET_KEY

const WalletTransferStore = useWalletTransferStore()
const { isWalletTransfer, $WalletTransfer } = storeToRefs(WalletTransferStore)

const ticketStore = useTicketStore()
const { getTickets } = ticketStore

const walletStore = useWalletStore()
const { walletAddress } = storeToRefs(walletStore)

const activeTab = ref('how-to-win')
const isDark = ref(localStorage.getItem('theme') !== 'light')

/**
 * Handles the result after the user confirms a payment
 */
const handlePaymentStatus = async (result, prop) => {
    if (result) {
        const number_tickets = prop.ticketsNumbers.join('-')
        const { data, error } = await supabase.functions.invoke('verify-payments', {
            body: {
                ptxhass: result,
                wallet: walletAddress.value,
                ticket: number_tickets
            }
        })

        if (data) {
            WalletTransferStore.WalletTransferClose()
            await getTickets()
        }
    }
}

// When WalletTransfer modal opens, start payment flow
watch($WalletTransfer, (wallett) => {
    if (wallett != null) {
        wallett?.assignPayment(walletAddress.value, 2)
    }
})

// Watch for theme toggle
watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})
</script>

<template>
    <!-- Wallet transfer modal -->
    <div v-if="isWalletTransfer">
        <WalletTransfer ref="$WalletTransfer" :toAddress="mywallet" v-model:open="isWalletTransfer"
            @payment-status="handlePaymentStatus" />
    </div>

    <!-- Main content -->
    <div
        class="max-w-2xl mx-auto mt-6 px-4 text-gray-900 bg-neutral-50 dark:bg-[#181a20] dark:text-white transition-colors">

        <!-- Theme toggle -->
        <div class="flex justify-end mb-2 absolute top-2 left-0 right-0">
            <button @click="isDark = !isDark" class="text-xs bg-yellow-400 text-black px-3 py-1 rounded font-semibold">
                Switch to {{ isDark ? 'light ☀️' : 'dark 🌙' }}
            </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 border-b border-yellow-400 mb-1">
            <button class="py-2 px-4 font-semibold cursor-pointer"
                :class="activeTab === 'tickets' ? 'border-b-2 border-yellow-400 text-yellow-400 !cursor-auto' : 'text-gray-400 dark:text-gray-500'"
                @click="activeTab = 'tickets'">
                🎟️ Tickets
            </button>
            <button class="py-2 px-4 font-semibold cursor-pointer"
                :class="activeTab === 'players' ? 'border-b-2 border-yellow-400 text-yellow-400 !cursor-auto' : 'text-gray-400 dark:text-gray-500'"
                @click="activeTab = 'players'">
                👥 Players
            </button>
            <button class="py-2 px-4 font-semibold cursor-pointer"
                :class="activeTab === 'how-to-win' ? 'border-b-2 border-yellow-400 text-yellow-400 !cursor-auto' : 'text-gray-400 dark:text-gray-500'"
                @click="activeTab = 'how-to-win'">
                🏆 How to Win
            </button>
            <button class="py-2 px-4 font-semibold cursor-pointer"
            :class="activeTab === 'important' ? 'border-b-2 border-yellow-400 text-yellow-400 !cursor-auto' : 'text-gray-400 dark:text-gray-500'"
            @click="activeTab = 'important'">
            📌 Important
            </button>
        </div>

        <!-- Tab content -->
        <div class="w-full pr-1 relative">
            <div v-if="activeTab === 'tickets'">
                <TicketHistory />
            </div>

            <div v-if="activeTab === 'players'">
                <PlayerList />
            </div>

            <div v-if="activeTab === 'how-to-win'" class="mb-5">
                <HowToWin />
            </div>
            <div v-if="activeTab === 'important'">
                <ImportantInfo />
            </div>
        </div>
    </div>
</template>

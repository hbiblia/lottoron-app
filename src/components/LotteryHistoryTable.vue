<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTicketStore } from '@/stores/ticketStore'
import { storeToRefs } from 'pinia'

const ticketStore = useTicketStore()
const { tickets } = storeToRefs(ticketStore)

// Computed reference to the tickets
const ticketsV = computed(() => tickets.value)

// Current timestamp, updated every second
const now = ref(Date.now())
let intervalId

// Start timer on mount
onMounted(() => {
    intervalId = setInterval(() => {
        now.value = Date.now()
    }, 1000)
})

// Clear interval on unmount
onUnmounted(() => {
    clearInterval(intervalId)
})

// Tickets for future draws
const upcomingTickets = computed(() =>
    ticketsV.value.filter(t => new Date(t.lottery_valid) > new Date(now.value))
)

// Tickets for past draws
const pastTickets = computed(() =>
    ticketsV.value.filter(t => new Date(t.lottery_valid) <= new Date(now.value))
)

// Format a date to human-readable string
const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date)
}

// Determines if a ticket is recently created (last 3 seconds)
const isNewTicket = (created) => {
    return now.value - new Date(created).getTime() <= 3000
}
</script>


<template>
    <div v-if="upcomingTickets.length || pastTickets.length" class="w-full">
        <h2 class="text-left font-bold text-sm mt-6 mb-2 text-gray-500 dark:text-gray-300">
            🎟️ Draw History
        </h2>

        <div class="overflow-x-auto rounded-lg shadow-md">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700 text-sm">
                <thead class="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                        <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Draw</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Numbers</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">$RON</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                    <!-- Upcoming Tickets -->
                    <tr v-for="ticket in upcomingTickets.sort((a, b) => b.drawId - a.drawId)" :key="'u-' + ticket.id"
                        :class="[
                            'transition-colors duration-500',
                            isNewTicket(ticket.created)
                                ? 'bg-blue-100 dark:bg-blue-800'
                                : 'hover:bg-yellow-50 dark:hover:bg-neutral-800'
                        ]">
                        <td class="px-4 py-3 text-yellow-500 font-bold">Upcoming</td>
                        <td class="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                            <div>Draw #{{ ticket.lottery }}</div>
                            <div class="text-[10px] text-gray-500 dark:text-gray-400">
                                Valid: {{ formatDate(ticket.lottery_valid) }}
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="grid grid-cols-3 gap-1">
                                <div v-for="(num, i) in ticket.lottery_number.split('-')" :key="i"
                                    class="bg-yellow-300 dark:bg-yellow-400 text-black text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center shadow-inner">
                                    {{ num }}
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-[11px] text-gray-500 dark:text-gray-400 text-right">
                            {{ formatDate(ticket.created) }}
                        </td>
                        <td class="px-4 py-3 font-bold text-gray-800 dark:text-white text-right">
                            {{ ticket.total }}
                        </td>
                    </tr>

                    <!-- Past Tickets -->
                    <tr v-for="(ticket, i) in pastTickets" :key="'p-' + i" :class="[
                        'transition-colors duration-500 opacity-80',
                        isNewTicket(ticket.created)
                            ? 'bg-blue-100 dark:bg-blue-800'
                            : ticket.wine
                                ? 'bg-green-100 dark:bg-green-800'
                                : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                    ]">
                        <td class="px-4 py-3 text-gray-400 font-bold">Past</td>
                        <td class="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                            <div>Draw #{{ ticket.lottery }}</div>
                            <div class="text-[10px] text-gray-500 dark:text-gray-400">
                                Valid: {{ formatDate(ticket.lottery_valid) }}
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <div class="grid grid-cols-3 gap-1">
                                <div v-for="(num, i) in ticket.lottery_number.split('-')" :key="i" :class="[
                                    'text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center shadow-inner',
                                    ticket.wine
                                        ? 'bg-green-300 dark:bg-green-600 text-black'
                                        : 'bg-yellow-100 text-black'
                                ]">
                                    {{ num }}
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-[11px] text-gray-500 dark:text-gray-400 text-right">
                            {{ formatDate(ticket.created) }}
                        </td>
                        <td class="px-4 py-3 font-bold text-gray-800 dark:text-white text-right">
                            {{ ticket.total }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

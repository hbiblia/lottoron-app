<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '@/services/supabase'
import uiSpinner from './uiSpinner.vue'

const usersActive = ref([])
const usersExpired = ref([])
const roomPlayerList = ref(null)
const isLoading = ref(false)
const drawResults = ref({})

const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}....${address.slice(-4)}`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const fetchAndGroupWalletTickets = async () => {
  isLoading.value = true
  const { data, error } = await supabase.rpc('wallet_get_all_tickets')

  if (error || !data || !Array.isArray(data)) {
    console.error('❌ Error fetching tickets:', error)
    isLoading.value = false
    return
  }

  const now = new Date()
  const activeGrouped = {}
  const expired = []

  for (const curr of data) {
    const wallet = curr.wallet
    const validDate = new Date(curr.lottery_valid)

    const ticket = {
      wallet,
      tickets: curr.tickets || 1,
      lottery_valid: curr.lottery_valid,
      draw: curr.lottery,
      wine: curr.wine || false,
      numbers: curr.lottery_number || '',
      explorer: curr.explorer || '',
    }

    if (validDate > now) {
      if (!activeGrouped[wallet]) {
        activeGrouped[wallet] = {
          wallet,
          tickets: 0,
          lottery_valid: curr.lottery_valid,
          draw: curr.lottery,
          wine: false
        }
      }

      activeGrouped[wallet].tickets += ticket.tickets
      if (ticket.wine) activeGrouped[wallet].wine = true
    } else {
      expired.push(ticket)
    }
  }

  usersActive.value = Object.values(activeGrouped)
  usersExpired.value = expired
  isLoading.value = false

  const draws = [...new Set(expired.map(u => u.draw))]
  const { data: lottoData } = await supabase
    .from('lotto')
    .select('lottery_id, n1')
    .in('lottery_id', draws)

  drawResults.value = Object.fromEntries((lottoData || []).map(row => [row.lottery_id, row.n1]))
}

const groupExpiredByDraw = (players) => {
  const grouped = {}
  for (const player of players) {
    if (!grouped[player.draw]) {
      grouped[player.draw] = []
    }
    grouped[player.draw].push(player)
  }
  return Object.values(grouped).reverse()
}

const explorer = (user) => {
  const url = `https://app.roninchain.com/tx/${user.explorer}`
  window.open(url, '_blank')
}

onMounted(() => {
  isLoading.value = true
  roomPlayerList.value = supabase.channel('roomPlayerList')
    .on('presence', { event: 'sync' }, fetchAndGroupWalletTickets)
    .on('postgres_changes', { event: '*', table: 'tickets' }, fetchAndGroupWalletTickets)
    .subscribe()
})

onUnmounted(() => {
  if (roomPlayerList.value) roomPlayerList.value.unsubscribe()
})
</script>


<template>
  <div class="flex flex-col items-center gap-4 mt-2 w-full mb-10" v-if="isLoading">
    <uiSpinner />
  </div>

  <div v-if="usersActive.length === 0 && !isLoading">
    <div class="text-center text-sm text-red-500 bg-red-200 dark:bg-orange-200 dark:text-red-800 rounded-md px-4 py-2 my-5">
      👀 There are no active players. Get your ticket now!
    </div>
  </div>

  <!-- 🟢 Jugadores activos -->
  <div v-if="usersActive.length > 0 && !isLoading">
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
      🎯 Players waiting for the draw (valid): {{ usersActive.length }}
    </p>

    <div class="overflow-x-auto rounded-lg shadow-md">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700 text-sm">
        <thead class="bg-gray-50 dark:bg-neutral-800">
          <tr>
            <th class="px-4 py-3 text-left">Player</th>
            <th class="px-4 py-3">🎟️ Tickets</th>
            <th class="px-4 py-3">Valid</th>
            <th class="px-4 py-3">Draw</th>
            <th class="px-4 py-3">🏆 Winner</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-neutral-900 divide-y divide-yellow-100 dark:divide-neutral-700">
          <tr v-for="user in usersActive" :key="user.wallet" class="hover:bg-yellow-50 dark:hover:bg-yellow-100/30">
            <td class="px-4 py-3 text-xs">{{ formatAddress(user.wallet) }}</td>
            <td class="px-4 py-3 text-center font-bold">{{ user.tickets }}</td>
            <td class="px-4 py-3 text-center text-xs">{{ formatDate(user.lottery_valid) }}</td>
            <td class="px-4 py-3 text-center text-xs">#{{ user.draw }}</td>
            <td class="px-4 py-3 text-center font-bold">
              <span v-if="user.wine">🏆 Yes</span>
              <span v-else class="text-gray-400">–</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 🔴 Jugadores anteriores por sorteo -->
  <div v-if="usersExpired.length > 0 && !isLoading" class="mt-10">
    <p class="text-sm text-red-600 dark:text-red-300 mb-2">
      ⏰ Players with expired tickets: {{ usersExpired.length }}
    </p>

    <div v-for="(group, i) in groupExpiredByDraw(usersExpired)" :key="i" class="mb-6">
      <h3 class="text-sm font-bold text-red-500 dark:text-red-400 mb-2">
        🎲 Draw #{{ group[0].draw }} - Winning Numbers: {{ drawResults[group[0].draw] || '...' }}
      </h3>

      <div class="overflow-x-auto rounded-lg shadow-md">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700 text-sm opacity-90">
          <thead class="bg-red-50 dark:bg-neutral-800">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-red-600 dark:text-red-300">⏰ Player</th>
              <!-- <th class="px-4 py-3 font-semibold text-red-600 dark:text-red-300">🎟️ Tickets</th> -->
              <th class="px-4 py-3 font-semibold text-red-600 dark:text-red-300">Numbers</th>
              <th class="px-4 py-3 font-semibold text-red-600 dark:text-red-300">Valid</th>
              <th class="px-4 py-3 font-semibold text-red-600 dark:text-red-300">🏆 Winner</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-neutral-900 divide-y divide-yellow-100 dark:divide-neutral-700">
            <tr v-for="user in group" :key="user.wallet + user.lottery_valid" class="hover:bg-red-100 dark:hover:bg-yellow-100/20 text-gray-500 dark:text-gray-400" :class="{'cursor-pointer':user.wine}" @click="user.wine && explorer(user)">
              <td class="px-4 py-3 text-xs">⏰ {{ formatAddress(user.wallet) }}</td>
              <!-- <td class="px-4 py-3 text-center font-bold">{{ user.tickets }}</td> -->
              <td class="px-4 py-3 text-center text-xs">{{ user.numbers }}</td>
              <td class="px-4 py-3 text-center text-xs">{{ formatDate(user.lottery_valid) }}</td>
              <td class="px-4 py-3 text-center font-bold">
                <span v-if="user.wine" class="text-green-600 dark:text-green-400">🏆 Yes</span>
                <span v-else class="text-gray-300">–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
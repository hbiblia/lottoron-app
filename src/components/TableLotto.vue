<script setup>
import { ref, onUnmounted, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLotteryStore } from '@/stores/lotteryStore'
import { supabase } from '@/services/supabase'

// Store y referencias reactivas
const lotteryStore = useLotteryStore()
const { getLottery } = lotteryStore
const { lotteryAvailable } = storeToRefs(lotteryStore)

const lottovalues = ref([
  { id: 0, text: '00' }, { id: 1, text: '00' },
  { id: 2, text: '00' }, { id: 3, text: '00' },
  { id: 4, text: '00' }, { id: 5, text: '00' }
])

const animatedTime = ref('00:00:00')
const lotteryData = ref(null)
const roomLotto = ref(null)
const lotton_is_completed = ref(false)
let interval = null
let countdownInterval = null

/**
 * Anima los números aleatoriamente
 */
function animateNumbers() {
  clearInterval(interval)
  interval = setInterval(() => {
    lottovalues.value = lottovalues.value.map((item, i) => ({
      id: i,
      text: String(Math.floor(Math.random() * 99)).padStart(2, '0')
    }))
  }, 100)
}

/**
 * Cronómetro basado en la hora real
 */
function startCountdown(targetDate, extraMinutes = 0) {
  if (countdownInterval) clearInterval(countdownInterval)

  countdownInterval = setInterval(() => {
    const now = Date.now()
    const target = new Date(targetDate).getTime() + extraMinutes * 60 * 1000
    const remaining = Math.max(0, target - now)

    const totalSeconds = Math.floor(remaining / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')

    animatedTime.value = `${h}:${m}:${s}`
  }, 1000)
}

/**
 * Actualiza el contador usando la data de la lotería
 */
function updateCountdownFromLotteryData(data) {
  const baseDate = data?.valid ?? data?.next
  if (baseDate) {
    const extra = data?.is_completed ? 2 : 0
    startCountdown(baseDate, extra)
  } else {
    animatedTime.value = '00:00:00'
    clearInterval(countdownInterval)
  }
}

/**
 * Establece los valores ganadores cuando se termina el sorteo
 */
function setLottoValues(n1) {
  const lotton = n1.split('-')
  lottovalues.value = lotton.map((num, index) => ({
    id: index,
    text: num
  }))
}

/**
 * Inicialización al montar el componente
 */
onMounted(async () => {
  lotteryData.value = await getLottery()
  lotteryAvailable.value = true

  animateNumbers()
  updateCountdownFromLotteryData(lotteryData.value)
  lotteryAvailable.value = !lotteryData.value?.is_locked

  if (!lotteryData.value?.valid && lotteryData.value?.n1) {
    clearInterval(interval)
    setLottoValues(lotteryData.value.n1)
    lotton_is_completed.value = true
  }

  roomLotto.value = supabase.channel('lotto')
    .on('postgres_changes', { event: '*', table: 'lotto' }, (payload) => {
      lotteryData.value = payload.new
      console.log(payload.new)

      if (payload.new.is_completed) {
        clearInterval(interval)
        setLottoValues(payload.new.n1)
      } else {
        animateNumbers()
      }

      updateCountdownFromLotteryData(payload.new)
      lotteryAvailable.value = !payload.new.is_locked
      lotton_is_completed.value = payload.new.is_completed
    }).subscribe()
})

/**
 * Limpieza al desmontar el componente
 */
onUnmounted(async () => {
  await supabase.removeChannel(roomLotto.value)
  clearInterval(interval)
  clearInterval(countdownInterval)
})
</script>

<template>
  <div
    class="grid place-items-center text-center gap-4 w-full max-w-xl mx-auto px-4 roboto text-black dark:text-white transition-colors">

    <!-- Logo -->
    <div class="relative">
      <img alt="Vue logo" src="@/assets/logo.png" width="125" height="125"
        class="motion-preset-bounce drop-shadow-md" />
    </div>

    <!-- Title -->
    <h1 class="text-3xl font-semibold drop-shadow-sm">
      Make the winning play
    </h1>

    <!-- Lottery numbers -->
    <div class="flex flex-wrap items-center justify-center gap-3">
      <div v-for="(lottovalue, i) in lottovalues" :key="lottovalues.id"
        class="bg-white dark:bg-neutral-100 text-black dark:text-black border border-neutral-300 rounded-2xl w-20 h-20 flex items-center justify-center text-5xl font-bold shadow-lg transition transform hover:scale-105"
        :class="[{ 'motion-preset-bounce motion-preset-slide-down': lottovalue.text != '' }, { 'bg-yellow-400 dark:bg-yellow-500 text-white': lotton_is_completed }]">
        <span>{{ lottovalue.text }}</span>
      </div>
    </div>

    <!-- Countdown timer -->
    <div class="grid gap-1">
      <span class="text-6xl font-mono tracking-wide text-yellow-300">
        {{ animatedTime }}
      </span>
      <span class="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        Next round
      </span>
    </div>
  </div>
</template>

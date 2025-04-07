import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

/**
 * Lottery store for managing current lottery state and data.
 */
export const useLotteryStore = defineStore('lottery', () => {

    // Indicates whether a lottery is currently active or available
    const lotteryAvailable = ref(false)

    /**
     * Fetches the current lottery data from Supabase.
     * Uses a stored procedure called 'lottery_get'.
     */
    async function getLottery() {
        const { data, error } = await supabase.rpc('lottery_get')
        if (error) {
            console.error('Error fetching lottery data:', error)
        } else {
            return data
        }
    }

    return {
        getLottery,
        lotteryAvailable,
    }
})

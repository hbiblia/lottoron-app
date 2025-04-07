import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { supabase } from '@/services/supabase'
import { useWalletStore } from '@/stores/walletStore'

/**
 * Store that manages ticket generation and retrieval for the lottery system.
 */
export const useTicketStore = defineStore('ticketStore', () => {

  const walletStore = useWalletStore()
  const { walletAddress } = storeToRefs(walletStore)

  const tickets = ref([])          // All tickets for the current user
  const errorMessage = ref('')     // Error message for validation

  /**
   * Generates a ticket with 6 random unique numbers between 00 and 39.
   */
  const generateTicket = () => {
    const numbers = generateRandomNumbers(6, 0, 39)
    return numbers
  }

  /**
   * Validates and formats user-defined custom ticket numbers.
   * Ensures all numbers are unique and in range 0-39.
   */
  const generateCustomTicket = (customNumbers) => {
    errorMessage.value = ''

    const numSet = new Set(customNumbers.map(n => parseInt(n)))
    const valid = [...numSet].every(n => !isNaN(n) && n >= 0 && n <= 39)

    if (numSet.size !== 6 || !valid) {
      errorMessage.value = 'The numbers must be 6, unique, and between 0 and 39.'
      return
    }

    const formattedNumbers = [...numSet].map(n => String(n).padStart(2, '0'))
    return formattedNumbers
  }

  /**
   * Utility function to generate a set of unique random numbers.
   */
  const generateRandomNumbers = (count, min, max) => {
    const nums = new Set()
    while (nums.size < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min
      nums.add(String(num).padStart(2, '0'))
    }
    return [...nums]
  }

  /**
   * Fetches the user's ticket list using their wallet address.
   */
  const getTickets = async () => {
    const { data, error } = await supabase.rpc('wallet_get_tickets', {
      pwallet: walletAddress.value
    })

    tickets.value = data?.sort((a, b) => b.id - a.id) ?? []
  }

  return {
    tickets,
    errorMessage,
    generateTicket,
    generateCustomTicket,
    getTickets
  }
})

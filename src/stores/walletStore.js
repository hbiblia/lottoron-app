import { ref, nextTick } from 'vue'
import { defineStore } from 'pinia'
import {
    ConnectorEvent,
    ConnectorErrorType,
    requestRoninWalletConnector,
} from "@sky-mavis/tanto-connect"
import { useTicketStore } from '@/stores/ticketStore'

/**
 * Store to manage wallet connection and verification status.
 */
export const useWalletStore = defineStore('wallet', () => {

    const ticketStore = useTicketStore()

    const walletAddress = ref(null)         // Wallet address
    const isWalletVerified = ref(false)     // Wallet verification status
    const connector = ref(null)             // Wallet connector instance
    const connectResult = ref(null)         // Raw result from connector
    const error = ref(null)                 // Error state (if any)

    /**
     * Opens the Ronin wallet and tries to connect.
     */
    const connectWallet = async () => {
        try {
            if (!window.ronin) {
                window.open("https://wallet.roninchain.com", "_blank");
                return;
            }

            const result = await connector.value?.connect()

            if (result) {
                connectResult.value = result.account
                await connector.value.switchChain(connectResult.value.chainId)
            }
        } catch (err) {
            error.value = err
        }
    }

    /**
     * Checks if the wallet is already connected and initializes listeners.
     */
    const walletIsConnect = async () => {
        try {
            connector.value = await requestRoninWalletConnector()

            // On successful connection
            connector.value.on(ConnectorEvent.CONNECT, async () => {
                connectResult.value = await connector.value.getAccounts()
                if (connectResult.value.length > 0) {
                    walletAddress.value = connectResult.value[0]
                    isWalletVerified.value = true
                    await ticketStore.getTickets()
                }
            })

            // On disconnect
            connector.value.on(ConnectorEvent.DISCONNECT, async () => {
                await disconnect()
            })

            // Attempt auto-connect
            connector.value.autoConnect()

            // In case autoConnect resolves immediately
            if (connectResult.value?.length > 0) {
                walletAddress.value = connectResult.value[0]
                isWalletVerified.value = true
            }
        } catch (err) {
            error.value = err
        }
    }

    /**
     * Disconnects the wallet and resets state.
     */
    const disconnect = async () => {
        try {
            await connector.value?.provider?.disconnect()
        } catch (err) {
            console.warn("Error disconnecting wallet:", err)
        }

        nextTick(() => {
            connectResult.value = null
            walletAddress.value = null
            isWalletVerified.value = false
        })
    }

    return {
        walletAddress,
        isWalletVerified,
        connectWallet,
        walletIsConnect
    }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWalletTransferStore = defineStore('wallettransfer', () => {
    const isWalletTransfer = ref(false)
    const $WalletTransfer = ref(null)
    const walletTransferProp = ref({})

    const WalletTransferOpen = (value, props) => {
        walletTransferProp.value = props
        isWalletTransfer.value = value
    }

    const WalletTransferClose = () => {
        walletTransferProp.value = null
        isWalletTransfer.value = false
    }

    const getWalletTransferData = () => {
        return walletTransferProp.value
    }

    return {
        isWalletTransfer,
        $WalletTransfer,
        WalletTransferOpen,
        WalletTransferClose,
        getWalletTransferData
    }
})

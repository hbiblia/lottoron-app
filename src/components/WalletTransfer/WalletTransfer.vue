<script setup>
import { ref, computed } from "vue";
import { withdrawFromWallet } from "./services";
import { requestRoninWalletConnector } from "@sky-mavis/tanto-connect";
import { useWalletTransferStore } from "@/components/WalletTransfer/stores";
import logo from "@/assets/logo.png";

// Props & Emits
const props = defineProps({
  open: Boolean,
  toAddress: String,
});

const emit = defineEmits(["update:open", "payment-status"]);

const { getWalletTransferData } = useWalletTransferStore();

// State
const isProcessing = ref(null); // null | 'loading' | 'error'
const expected_amount = ref(0);
const errorMessage = ref("");
const fromAddress = ref("");

// Close modal
const close = () => emit("update:open", false);

// Format wallet address (shortened)
const formatAddress = computed(() => {
  if (!fromAddress.value) return "";
  return `${fromAddress.value.slice(0, 6)}....${fromAddress.value.slice(-4)}`;
});

// Start payment process
const processPayment = async () => {
  if (!expected_amount.value || expected_amount.value <= 0) {
    isProcessing.value = "error";
    errorMessage.value = "The amount must be greater than 0.";
    emit("payment-status", null);
    return null;
  }

  isProcessing.value = "loading";
  errorMessage.value = "";

  const connector = await requestRoninWalletConnector();
  connector?.autoConnect();

  try {
    const result = await withdrawFromWallet(
      props.toAddress,
      expected_amount.value.toString()
    );
    emit("payment-status", result, getWalletTransferData());
    isProcessing.value = null;
    return result;
  } catch (error) {
    console.error(error);
    errorMessage.value = error?.message || "Unknown error";
    isProcessing.value = "error";
    emit("payment-status", null);
    return null;
  }
};

// Retry after error
const tryAgain = () => {
  processPayment();
};

// Assign values and start process
const assignPayment = (froma, v) => {
  expected_amount.value = v;
  fromAddress.value = froma;
  processPayment();
};

// Expose method to parent component
defineExpose({ processPayment, assignPayment });
</script>

<template>
  <!-- Overlay -->
  <div class="fixed top-0 left-0 w-full h-full bg-black/70 z-20" />

  <!-- Modal -->
  <div
    class="w-80 h-fit fixed inset-0 m-auto z-20 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-2xl p-2 transition-colors duration-300 shadow-md"
  >
    <!-- Close button -->
    <div class="w-full h-10 flex justify-end" v-if="isProcessing === 'error'">
      <button
        @click="close"
        class="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white p-2 rounded-full transition-colors cursor-pointer"
        aria-label="Close"
      >
        ✕
      </button>
    </div>

    <!-- Logo -->
    <div class="flex justify-center items-center mb-3">
      <img :src="logo" width="75" />
    </div>

    <!-- Status Area -->
    <div class="flex-center flex-wrap w-full gap-5 text-wrap">
      <!-- Loading Spinner -->
      <div
        class="w-full flex justify-center items-center mb-5"
        v-if="isProcessing === 'loading'"
      >
        <div role="status">
          <svg
            aria-hidden="true"
            class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-700 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 ... "
              fill="currentColor"
            />
            <path d="M93.9676 39.0409C96.393 ... " fill="currentFill" />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="isProcessing === 'error'" class="w-full text-center">
        <div class="text-xl text-red-500 dark:text-red-400">
          {{ errorMessage }}
        </div>
        <div class="text-xl my-5">
          Wallet {{ formatAddress }} does not have enough funds.
        </div>
        <div class="mt-3 flex-center">
          <button
            @click="tryAgain"
            class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </div>

      <!-- Loading Confirmation -->
      <div v-else-if="isProcessing === 'loading'" class="w-full text-center">
        <div class="text-base text-center">Confirming with Ronin Wallet</div>
      </div>

      <!-- Waiting Confirmation -->
      <div v-else class="w-full text-center">
        <div class="text-base text-center">Transaction pending...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tktk > ul li {
  margin-bottom: 5px;
}
</style>

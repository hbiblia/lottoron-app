<script setup>
import { RouterLink, RouterView } from 'vue-router'
import TableLotto from '@/components/TableLotto.vue'
import TicketToolbar from './components/TicketToolbar.vue'
</script>

<template>
  <div class="w-full h-full absolute top-0 left-0 overflow-y-scroll m-auto select-none pt-3
              bg-neutral-50 text-black dark:bg-[#181a20] dark:text-white transition-colors roboto">

    <!-- Contenido principal -->
    <div class="wrapper flex items-center justify-center flex-wrap m-auto w-fit">
      <TableLotto />
      <TicketToolbar />
    </div>

    <!-- Vista de rutas (opcional) -->
    <RouterView />

    <!-- ✅ Botón flotante de soporte -->
    <a href="https://discord.gg/xxemTpaM" target="_blank" rel="noopener noreferrer" class="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full text-sm font-semibold shadow-lg
             bg-blue-600 text-white hover:bg-blue-700 transition-colors">
      💬 Discord Support
    </a>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

.roboto {
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
  font-variation-settings: "wdth" 100;
}
</style>

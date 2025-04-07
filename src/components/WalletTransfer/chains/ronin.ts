import { defineChain } from 'viem';

export const ronin = defineChain({
  id: 2020,
  name: 'Ronin',
  nativeCurrency: {
    name: 'Ronin',
    symbol: 'RON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.roninchain.com/rpc'],
    },
  },
});

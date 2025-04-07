import { createWalletClient, parseEther, custom } from 'viem';
import { ronin } from './chains/ronin';

let errorType = null;

/**
 * Sends RON from the connected wallet to a specified address.
 * 
 * @param {string} toAddress - The destination wallet address.
 * @param {string} amount - Amount of RON to send (as a string).
 * @returns {Promise<string>} - The transaction hash if successful.
 */
export async function withdrawFromWallet(toAddress, amount) {
  try {
    const { provider } = (window.ronin || window.ethereum);

    if (!provider || typeof provider.request !== 'function') {
      errorType = {
        code: 402,
        message: 'No wallet provider or request method found.',
        error: null
      };
      throw errorType;
    }

    const client = createWalletClient({
      chain: ronin,
      transport: custom(provider),
    });

    const [account] = await client.getAddresses();

    const txHash = await client.sendTransaction({
      account,
      to: toAddress,
      value: parseEther(amount),
    });

    return txHash;
  } catch (error) {
    // User rejected the transaction
    if (error?.code === 4001 || error?.message?.includes('User rejected')) {
      console.warn('❌ User rejected the transaction.');
      errorType = {
        code: 401,
        message: 'User rejected the transaction.',
        error: error?.message
      };
    } else if (!errorType) {
      // Generic wallet error
      errorType = {
        code: 403,
        message: 'Wallet connection failed.',
        error: error?.message
      };
    }

    console.error('❌ Error sending RON:', error);
    throw errorType;
  }
}

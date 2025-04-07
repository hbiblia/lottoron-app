// Load Supabase Edge Runtime definitions
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Supabase and viem dependencies
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createPublicClient, http, parseEther } from 'npm:viem'

// ─────────────────────────────────────────────────────────────
// CORS Headers to allow frontend requests
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────────────────────
// Ronin Chain Configuration (for RPC interaction)
// ─────────────────────────────────────────────────────────────
const roninChain = {
  id: 2020,
  name: 'Ronin',
  nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.roninchain.com/rpc'] }
  },
}

// ─────────────────────────────────────────────────────────────
// Helper function to wait for transaction confirmation
// ─────────────────────────────────────────────────────────────
/**
 * Waits for a transaction to be confirmed by checking the tx and receipt repeatedly.
 * @param client - The viem public client
 * @param txHash - The transaction hash to verify
 * @param maxRetries - Max attempts before giving up
 * @param intervalMs - Delay between attempts in milliseconds
 */
async function waitForTransactionDataAndConfirmation(client, txHash, maxRetries = 5, intervalMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await client.getTransaction({ hash: txHash })
      const receipt = await client.getTransactionReceipt({ hash: txHash })

      // If both tx and receipt exist and receipt shows success
      if (tx && receipt && receipt.status === 'success') {
        console.log(`✅ Confirmed on attempt ${attempt}`)
        return { tx, receipt }
      }

      console.log(`⌛ Not yet confirmed or not found (attempt ${attempt})`)
    } catch (e) {
      console.log(`❌ Failed to fetch transaction (attempt ${attempt}):`, e)
    }

    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  // After retries, still no confirmation
  throw new Error('❌ Transaction not confirmed or found after multiple attempts')
}

// ─────────────────────────────────────────────────────────────
// Edge function handler
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Preflight request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Supabase client (service role for write access)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Ronin public RPC client for fetching tx info
  const client = createPublicClient({
    chain: roninChain,
    transport: http()
  })

  // Extract data from request body
  const { ptxhass, wallet, ticket } = await req.json()

  try {
    // Wait until transaction is confirmed
    const { tx, receipt } = await waitForTransactionDataAndConfirmation(client, ptxhass)

    // Validate amount (must be at least 2 RON)
    const expectedAmount = parseEther('2')
    if (tx.value < expectedAmount) {
      console.log('❌ Insufficient amount:', ptxhass)
      return new Response('❌ Insufficient amount', { status: 400, headers: corsHeaders })
    }

    // Call stored procedure to generate ticket
    const aresult = await supabase.rpc('generate_ticked', {
      pwallet: wallet,
      pticket: ticket,
      ptxhass: ptxhass
    })

    // If it fails, something went wrong with the DB logic
    if (!aresult.data) throw new Error('Could not process reward.')

    // Everything OK
    return new Response('✅ Payment confirmed', { headers: corsHeaders })

  } catch (error) {
    console.log('❌ Error verifying payment:', ptxhass, error)
    return new Response('❌ Error verifying payment', { status: 500, headers: corsHeaders })
  }
})

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createWalletClient, http, parseEther } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'

// ─────────────────────────────────────────────────────────────
// CORS configuration for browser compatibility
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─────────────────────────────────────────────────────────────
// Ronin blockchain config
// ─────────────────────────────────────────────────────────────
const roninChain = {
  id: 2020,
  name: 'Ronin',
  nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.roninchain.com/rpc'] }
  }
}

// ─────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ─────────────────────────────────────────────────────────────
// Wallet client used to send RON to winners
// ─────────────────────────────────────────────────────────────
const account = privateKeyToAccount(Deno.env.get('RONIN_PRIVATE_KEY')!)
const walletClient = createWalletClient({
  account,
  chain: roninChain,
  transport: http(),
})

// ─────────────────────────────────────────────────────────────
// Helper: Check if less than 30 minutes are left
// ─────────────────────────────────────────────────────────────
function isLessThan30MinLeft(valid) {
  const now = new Date()
  const target = new Date(valid)
  const diffMin = (target.getTime() - now.getTime()) / 1000 / 60
  return diffMin <= 2 && diffMin > 0
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if 10+ seconds have passed since valid
// ─────────────────────────────────────────────────────────────
function isMoreThan10SecAfter(valid) {
  const now = new Date()
  const target = new Date(valid)
  const diffSec = (now.getTime() - target.getTime()) / 1000
  return diffSec >= 10
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if 2+ minutes passed since last lotto
// ─────────────────────────────────────────────────────────────
function isMoreThan2MinAfter(valid) {
  const now = new Date()
  const target = new Date(valid)
  const diffMin = (now.getTime() - target.getTime()) / 1000 / 60
  return diffMin >= 2
}

// ─────────────────────────────────────────────────────────────
// Generate 6 random numbers between min and max (00-39)
// ─────────────────────────────────────────────────────────────
function generateRandomNumbers(count, min, max) {
  const nums = new Set()
  while (nums.size < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min
    nums.add(String(num).padStart(2, '0'))
  }
  return [...nums]
}

// ─────────────────────────────────────────────────────────────
// Convert ronin: address to hex 0x address
// ─────────────────────────────────────────────────────────────
function roninToHex(address) {
  return address.replace(/^ronin:/, '0x')
}

// ─────────────────────────────────────────────────────────────
// Get reward based on number of correct hits
// ─────────────────────────────────────────────────────────────
function calculateReward(hits) {
  switch (hits) {
    case 6: return 200
    case 5: return 50
    case 4: return 25
    case 3: return 4
    default: return 0
  }
}

// ─────────────────────────────────────────────────────────────
// Discord notification for winner
// ─────────────────────────────────────────────────────────────
async function notifyDiscordWinner(user) {
  const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
  const explorerUrl = `https://app.roninchain.com/tx/${user.explorer}`

  const embed = {
    title: '🎉 We Have a Lotto Winner!',
    description: `Congratulations to **${user.wallet}** for winning the draw. 🎰`,
    color: 0x00ff99,
    fields: [
      {
        name: '🎟️ Ticket',
        value: `#${user.lottoId}`,
        inline: true
      },
      {
        name: '👛 Wallet',
        value: `\`${user.wallet}\``,
        inline: true
      },
      {
        name: '🔗 Transaction',
        value: `[View on explorer](${explorerUrl})`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString()
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `@everyone 🎊`,
      embeds: [embed]
    })
  })
}

// ─────────────────────────────────────────────────────────────
// Sends RON to all winning players and logs result in DB
// ─────────────────────────────────────────────────────────────
async function sendRewardsToWinners(players_winners, lottoId) {
  console.log('🎁 Sending rewards to:', players_winners.length, 'players')

  // Group players by number of hits
  const grouped = {}
  for (const player of players_winners) {
    if (!grouped[player.hit]) grouped[player.hit] = []
    grouped[player.hit].push(player)
  }

  for (const hit in grouped) {
    const winners = grouped[hit]
    const totalReward = calculateReward(Number(hit))
    if (totalReward <= 0 || winners.length === 0) continue

    const share = totalReward / winners.length

    for (const player of winners) {
      const to = roninToHex(player.wallet)

      try {
        // Send transaction
        const txHash = await walletClient.sendTransaction({
          to,
          value: parseEther(share.toFixed(8))
        })

        console.log(`✅ Paid ${share} RON to ${player.wallet} [hit: ${hit}] → TX: ${txHash}`)

        // Mark ticket as winner
        await supabase.from('tickets').update({ is_winner: true, tx_hash: txHash}).eq('id', player.id)

        // Log payment
        await supabase.from('lotto_payments').insert({
          wallet: player.wallet,
          amount: share,
          tx_hash: txHash,
          hits: Number(hit),
          lotto_id: lottoId,
          status: 'sent'
        })

        await notifyDiscordWinner({lottoId:lottoId, wallet:player.wallet,explorer:txHash})

      } catch (err) {
        console.error(`❌ Failed to pay ${player.wallet}:`, err)

        await supabase.from('lotto_payments').insert({
          wallet: player.wallet,
          amount: share,
          tx_hash: null,
          hits: Number(hit),
          lotto_id: lottoId,
          status: 'failed',
          error: err.message || 'Unknown error'
        })
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Process all valid tickets, find winners, pay them
// ─────────────────────────────────────────────────────────────
async function processWinners(lottoRow, lotto_numbers) {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('valid', lottoRow.valid)
    .eq('lottery_id', lottoRow.lottery_id)
    .eq('is_completed', false)

  if (error || !tickets || tickets.length === 0) {
    console.log("❌ No valid tickets or query error.")
    return
  }

  const winners = []

  for (const player of tickets) {
    if (!player.numbers) continue

    const playerNumbers = player.numbers.split('-')
    const hits = playerNumbers.filter(n => lotto_numbers.includes(n)).length

    if (hits >= 3) {
      winners.push({ wallet: player.wallet, hit: hits, id: player.id })

      await supabase.from('tickets')
        .update({ is_completed: true })
        .eq('id', player.id)
    }
  }

  if (winners.length > 0) {
    await sendRewardsToWinners(winners, lottoRow.lottery_id)
  }
}

// ─────────────────────────────────────────────────────────────
// Main Edge function: runs on HTTP call
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get current active lotto
  const lottoRes = await supabase
    .from('lotto')
    .select('*')
    .eq('is_completed', false)
    .limit(1)

  const lottoRow = lottoRes.data?.[0]

  if (!lottoRow) {
    // No active lotto → maybe create a new one
    const lastCompleted = await supabase
      .from('lotto')
      .select('*')
      .eq('is_completed', true)
      .order('valid', { ascending: false })
      .limit(1)

    const last = lastCompleted.data?.[0]

    if (!last || isMoreThan2MinAfter(last.valid)) {
      await supabase.rpc('lottery_new')
    }

    return new Response('❌ No current lotto round found.', { headers: corsHeaders })
  }

  // If less than 30 minutes left and still unlocked
  if (isLessThan30MinLeft(lottoRow.valid) && lottoRow.is_locked === false) {
    await supabase.from('lotto').update({ is_locked: true }).eq('id', lottoRow.id)
    return new Response('✅ Less than 30 minutes left. Lotto locked.', { headers: corsHeaders })
  }

  // Wait at least 10 seconds after target time
  if (!isMoreThan10SecAfter(lottoRow.valid)) {
    return new Response('⏳ Draw not finished yet. Please wait.', { headers: corsHeaders })
  }

  // Draw numbers and process winners
  if (!lottoRow.is_completed) {
    const lotto_numbers = generateRandomNumbers(6, 0, 39)
    await supabase.from('lotto')
      .update({ n1: lotto_numbers.join('-'), is_completed: true })
      .eq('id', lottoRow.id)

    await processWinners(lottoRow, lotto_numbers)

    return new Response('✅ Lotto numbers registered and rewards sent.', { headers: corsHeaders })
  }

  return new Response('❌ Please wait until the 15-minute period ends.', { headers: corsHeaders })
})

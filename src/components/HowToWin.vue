<template>
    <div class="text-sm bg-[#fafafa] text-black px-4 py-3 dark:bg-[#1e2329] dark:text-white rounded-lg shadow">
        <h2 class="text-lg font-bold mb-2">How do you win in Lotto$RON?</h2>
        <ul class="list-disc ml-5 space-y-1">
            <li>Buy a ticket with 6 numbers between 00 and 39.</li>
            <li>Wait for the next draw, which happens every 40 hours.</li>
            <li>If your numbers match the drawn ones — you win!</li>
            <li>The more numbers you match, the higher your reward in <strong>$RON</strong>.</li>
            <li>If more than one player gets the same amount of matches, the prize is split between them.</li>
        </ul>

        <h3 class="text-base font-bold mt-4">Prize Categories</h3>
        <table class="w-full mt-2 text-xs text-black bg-white dark:bg-neutral-200 rounded-md overflow-hidden">
            <thead class="bg-yellow-200 dark:bg-yellow-300 text-left">
                <tr>
                    <th class="p-2">Category</th>
                    <th class="p-2">Matches</th>
                    <th class="p-2">Base Prize</th>
                </tr>
            </thead>
            <tbody>
                <tr class="border-t border-gray-300">
                    <td class="p-2 font-semibold">1</td>
                    <td class="p-2">6/6</td>
                    <td class="p-2">$RON 200</td>
                </tr>
                <tr class="border-t border-gray-300">
                    <td class="p-2 font-semibold">2</td>
                    <td class="p-2">5/6</td>
                    <td class="p-2">$RON 50</td>
                </tr>
                <tr class="border-t border-gray-300">
                    <td class="p-2 font-semibold">3</td>
                    <td class="p-2">4/6</td>
                    <td class="p-2">$RON 25</td>
                </tr>
                <tr class="border-t border-gray-300">
                    <td class="p-2 font-semibold">4</td>
                    <td class="p-2">3/6</td>
                    <td class="p-2">$RON 4</td>
                </tr>
            </tbody>
        </table>

        <p class="mt-3 text-sm">🎉 Good luck and play responsibly!</p>
    </div>
</template>

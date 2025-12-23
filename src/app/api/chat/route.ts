import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createPublicClient, createWalletClient, http, parseEther, hexToBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadSepolia } from '@/components/Providers'; // I should export it or redefine it
import connectDB from '@/lib/db';
import { Conversation } from '@/models/Conversation';
import { FuelBalance } from '@/models/FuelBalance';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const publicClient = createPublicClient({
    chain: monadSepolia,
    transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
});

const ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getBalance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "debit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export async function POST(req: NextRequest) {
    try {
        const { messages, walletAddress, type = 'text', conversationId } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
        }

        // 1. Verify Fuel Balance on-chain
        const contractAddress = process.env.NEXT_PUBLIC_LUMINA_FUEL_ADDRESS as `0x${string}`;
        if (!contractAddress) {
            // Mock for now if no address
            console.warn("LuminaFuel contract address not set. Skipping on-chain check.");
        } else {
            const balance = await publicClient.readContract({
                address: contractAddress,
                abi: ABI,
                functionName: 'getBalance',
                args: [walletAddress as `0x${string}`],
            }) as bigint;

            const required = type === 'image' ? parseEther('0.003') : parseEther('0.001');
            if (balance < required) {
                return NextResponse.json({ error: 'Insufficient fuel. Please deposit MON.' }, { status: 402 });
            }
        }

        // 2. Call Gemini API
        const model = genAI.getGenerativeModel({ model: type === 'image' ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview' });

        const lastMessage = messages[messages.length - 1].content;
        const result = await model.generateContent(lastMessage);
        let responseText = result.response.text();

        // 3. Handle specific Image Generation intent or model output
        if (type === 'image') {
            console.log("Raw Image Generation Output:", responseText);

            // Remove markdown code blocks if present
            const cleanText = responseText.replace(/```json|```/g, '').trim();

            if (cleanText.includes('dalle.text2im') || (cleanText.startsWith('{') && cleanText.endsWith('}'))) {
                try {
                    // Try to find the JSON part if there is surrounding text
                    const startIdx = cleanText.indexOf('{');
                    const endIdx = cleanText.lastIndexOf('}');
                    if (startIdx !== -1 && endIdx !== -1) {
                        const jsonStr = cleanText.substring(startIdx, endIdx + 1);
                        const parsed = JSON.parse(jsonStr);

                        let prompt = "";
                        if (parsed.action_input) {
                            // If action_input is a string, parse it
                            const input = typeof parsed.action_input === 'string' ? JSON.parse(parsed.action_input) : parsed.action_input;
                            prompt = input.prompt || input.text_prompt || "";
                        } else {
                            prompt = parsed.prompt || parsed.text || "";
                        }

                        if (prompt) {
                            responseText = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;
                        }
                    }
                } catch (e) {
                    console.error("JSON parsing error for image intent:", e);
                }
            }

            // If we still haven't converted to a URL, use the whole text as a prompt
            if (!responseText.startsWith('http')) {
                // Remove the "action" JSON if it's there but parsing failed (using [\s\S] for multiline)
                const simplified = responseText.replace(/\{[\s\S]*\}/, '').trim() || responseText;
                responseText = `https://pollinations.ai/p/${encodeURIComponent(simplified.substring(0, 500))}?width=1024&height=1024&model=flux`;
            }
        }

        // 4. Trigger Debit on-chain (Admin Relayer)
        if (contractAddress && process.env.ADMIN_PRIVATE_KEY) {
            const account = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);
            const walletClient = createWalletClient({
                account,
                chain: monadSepolia,
                transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
            });

            const amount = type === 'image' ? parseEther('0.003') : parseEther('0.001');

            const { request } = await publicClient.simulateContract({
                account,
                address: contractAddress,
                abi: ABI,
                functionName: 'debit',
                args: [walletAddress as `0x${string}`, amount],
            });

            await walletClient.writeContract(request);
        }

        // 4. Update MongoDB
        await connectDB();
        if (conversationId) {
            await Conversation.findByIdAndUpdate(conversationId, {
                $push: {
                    messages: [
                        { role: 'user', content: lastMessage, type },
                        { role: 'assistant', content: responseText, type }
                    ]
                }
            });
        } else {
            const newConv = await Conversation.create({
                walletAddress,
                messages: [
                    { role: 'user', content: lastMessage, type },
                    { role: 'assistant', content: responseText, type }
                ]
            });
            return NextResponse.json({ text: responseText, conversationId: newConv._id });
        }

        return NextResponse.json({ text: responseText });

    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

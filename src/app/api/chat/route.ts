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

        let responseText = "";

        // 3. Handle Gemini Native Image Generation
        if (type === 'image') {
            // Check if Gemini returned an image
            const candidates = result.response.candidates;
            if (candidates && candidates[0].content.parts) {
                const imagePart = candidates[0].content.parts.find(part => part.inlineData);
                if (imagePart && imagePart.inlineData) {
                    responseText = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                } else {
                    // Fallback: If no inlineData, check if it's text that we can use for a fallback if needed
                    // but according to user, it should return base64 directly
                    responseText = result.response.text();
                }
            } else {
                responseText = result.response.text();
            }
        } else {
            responseText = result.response.text();
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

            try {
                const { request } = await publicClient.simulateContract({
                    account,
                    address: contractAddress,
                    abi: ABI,
                    functionName: 'debit',
                    args: [walletAddress as `0x${string}`, amount],
                    gas: 100000n,
                });

                const hash = await walletClient.writeContract(request);
                console.log(`Relayer debit success: ${hash}`);
            } catch (txError: any) {
                console.error("Relayer debit failed:", txError.message);
            }
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

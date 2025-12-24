import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadSepolia } from '@/components/Providers'; // I should export it or redefine it
import connectDB from '@/lib/db';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';

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

        await connectDB();

        // 1. Verify Fuel Balance on-chain
        const contractAddress = process.env.NEXT_PUBLIC_LUMINA_FUEL_ADDRESS as `0x${string}`;
        const adminKey = process.env.ADMIN_PRIVATE_KEY;

        if (!contractAddress || !adminKey) {
            return NextResponse.json({
                error: 'Backend system synchronization error. Please contact administrator.'
            }, { status: 500 });
        }

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

        // 2. Prepare Conversation
        let activeConvId = conversationId;
        let isNewChat = false;

        if (!activeConvId) {
            const newConv = await Conversation.create({ walletAddress, title: 'New Synthesis' });
            activeConvId = newConv._id.toString();
            isNewChat = true;
        }

        // 3. Call Gemini API
        const model = genAI.getGenerativeModel({ model: type === 'image' ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview' });
        const lastMessage = messages[messages.length - 1].content;
        const result = await model.generateContent(lastMessage);

        let responseText = "";
        if (type === 'image') {
            const candidates = result.response.candidates;
            if (candidates && candidates[0].content.parts) {
                const imagePart = candidates[0].content.parts.find(part => part.inlineData);
                if (imagePart && imagePart.inlineData) {
                    responseText = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                } else {
                    responseText = result.response.text();
                }
            } else {
                responseText = result.response.text();
            }
        } else {
            responseText = result.response.text();
        }

        // 4. Trigger Debit on-chain (Admin Relayer)
        const account = privateKeyToAccount(adminKey as `0x${string}`);
        const walletClient = createWalletClient({
            account,
            chain: monadSepolia,
            transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'),
        });

        try {
            const gasPrice = await publicClient.getGasPrice();
            const { request } = await publicClient.simulateContract({
                account,
                address: contractAddress,
                abi: ABI,
                functionName: 'debit',
                args: [walletAddress as `0x${string}`, required],
                gas: 200000n,
                gasPrice,
            });
            await walletClient.writeContract(request);
        } catch (txError: any) {
            console.error("Relayer debit failed strictly:", txError.message);
            return NextResponse.json({ error: `Fuel debit failure: ${txError.message}` }, { status: 500 });
        }

        // 5. Persist Messages
        await Message.create([
            { conversationId: activeConvId, walletAddress, role: 'user', content: lastMessage, type },
            { conversationId: activeConvId, walletAddress, role: 'assistant', content: responseText, type }
        ]);

        await Conversation.findByIdAndUpdate(activeConvId, { updatedAt: new Date() });

        // 6. Generate Title if 3 prompts have been sent
        // A prompt + response = 2 messages. 3 prompts = 6 messages.
        const messageCount = await Message.countDocuments({ conversationId: activeConvId });

        if (messageCount === 6) {
            try {
                // Fetch all messages for context
                const history = await Message.find({ conversationId: activeConvId }).sort({ createdAt: 1 });
                const context = history.map(m => `${m.role}: ${m.content}`).join('\n');

                const titleModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
                const titleResult = await titleModel.generateContent(`Generate a concise 3-word title for this obsidian-themed AI chat based on this interaction context:\n${context.slice(0, 2000)}\n\nRespond ONLY with the 3 words.`);
                const title = titleResult.response.text().trim().replace(/["']/g, '');
                await Conversation.findByIdAndUpdate(activeConvId, { title });
            } catch (titleError) {
                console.error("Delayed title generation failed:", titleError);
            }
        }

        return NextResponse.json({
            text: responseText,
            conversationId: activeConvId,
            isNewChat
        });

    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

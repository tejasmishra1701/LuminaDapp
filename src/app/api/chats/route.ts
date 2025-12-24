import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        await connectDB();

        // Fetch conversations for the wallet, sorted by most recent
        const chats = await Conversation.find({ walletAddress })
            .select('title _id updatedAt')
            .sort({ updatedAt: -1 });

        return NextResponse.json(chats);
    } catch (error: any) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('id');

        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
        }

        await connectDB();

        // Delete conversation and associated messages
        await Conversation.findByIdAndDelete(chatId);
        await Message.deleteMany({ conversationId: chatId });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting chat:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

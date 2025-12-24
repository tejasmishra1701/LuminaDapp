import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message } from '@/models/Message';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: chatId } = await params;
        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
        }

        await connectDB();

        // Fetch messages for the conversation, sorted by creation time
        const messages = await Message.find({ conversationId: chatId })
            .sort({ createdAt: 1 });

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    type: 'text' | 'image';
    imageUrl?: string;
    timestamp: Date;
}

export interface IConversation extends Document {
    walletAddress: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'image'], default: 'text' },
    imageUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema<IConversation>({
    walletAddress: { type: String, required: true, index: true },
    messages: [MessageSchema],
}, { timestamps: true });

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

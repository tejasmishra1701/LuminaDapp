import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    walletAddress: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
    walletAddress: { type: String, required: true, index: true },
    title: { type: String, default: 'New Synthesis' },
}, { timestamps: true });

// Index for sidebar listing optimization
ConversationSchema.index({ walletAddress: 1, updatedAt: -1 });

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

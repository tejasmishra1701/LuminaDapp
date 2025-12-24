import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    walletAddress: string;
    role: 'user' | 'assistant';
    content: string;
    type: 'text' | 'image';
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'image'], default: 'text' },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Compound index for optimized chat history fetching
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IFuelBalance extends Document {
    walletAddress: string;
    balance: number; // in MON equivalent 
    totalSpent: number;
    lastDepositAt: Date;
}

const FuelBalanceSchema = new Schema<IFuelBalance>({
    walletAddress: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastDepositAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const FuelBalance = mongoose.models.FuelBalance || mongoose.model<IFuelBalance>('FuelBalance', FuelBalanceSchema);

import mongoose, { Schema, Document } from 'mongoose';

// Interface describing the properties for creating a new Session
export interface ISession extends Document {
    name: string;
    hours: number;
    quantity: number;
    totalAmount: number;
    startTime: Date;
    endTime: Date;
    status: 'active' | 'completed';
    areaId: string;
    notified?: boolean;
}

const SessionSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        hours: { type: Number, required: true },
        quantity: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },   
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        areaId: { type: String, required: true, index: true },
        notified: { type: Boolean, default: false },
    },
    {
    
        timestamps: true,
     
    }
);

export default mongoose.model<ISession>('Session', SessionSchema);
export interface Reminder {
    id: string;
    title: string;
    description?: string | null; // Allow `null` and `undefined`
    userId: string;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
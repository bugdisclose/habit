import { parseISO } from 'date-fns';

/**
 * Calculates the current streak based on an array of completed dates (YYYY-MM-DD).
 * A streak relies on consecutive days ending at Today or Yesterday.
 */
export function calculateStreak(completedDays: string[]): number {
    if (!completedDays || completedDays.length === 0) return 0;

    // Sort unique dates descending
    const uniqueDays = Array.from(new Set(completedDays)).sort().reverse();
    const today = new Date();

    if (uniqueDays.length === 0) return 0;

    // Check if strict streak is alive (must include Today or Yesterday)
    const lastCompleted = parseISO(uniqueDays[0]);
    const diff = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

    // 0 = Today, 1 = Yesterday. If diff > 1, streak is broken.
    if (diff > 1) return 0;

    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const current = parseISO(uniqueDays[i]);
        const next = parseISO(uniqueDays[i + 1]);

        // Difference between consecutive logged days
        const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculates the shared streak between two users.
 * Counts days where BOTH users completed the habit.
 */
export function calculateSharedStreak(myDays: string[], buddyDays: string[]): number {
    if (!myDays || !buddyDays) return 0;

    // Find intersection: Days both completed
    const sharedDays = myDays.filter(day => buddyDays.includes(day));

    return calculateStreak(sharedDays);
}

// Badge definitions for the gamification system

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'streak' | 'completion' | 'consistency' | 'social' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  criteria: {
    type: 'streak' | 'total_completions' | 'perfect_week' | 'perfect_month' | 'habits_created' | 'shares' | 'buddy_streak' | 'first_completion';
    value: number;
  };
  secret?: boolean; // Hidden until unlocked
}

export const BADGES: BadgeDefinition[] = [
  // === STREAK BADGES ===
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak on any habit',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    criteria: { type: 'streak', value: 7 }
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak on any habit',
    icon: '⚡',
    category: 'streak',
    tier: 'bronze',
    criteria: { type: 'streak', value: 14 }
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak on any habit',
    icon: '💪',
    category: 'streak',
    tier: 'silver',
    criteria: { type: 'streak', value: 30 }
  },
  {
    id: 'streak_60',
    name: 'Habit Hero',
    description: 'Maintain a 60-day streak on any habit',
    icon: '🦸',
    category: 'streak',
    tier: 'gold',
    criteria: { type: 'streak', value: 60 }
  },
  {
    id: 'streak_90',
    name: 'Quarter Champion',
    description: 'Maintain a 90-day streak on any habit',
    icon: '👑',
    category: 'streak',
    tier: 'gold',
    criteria: { type: 'streak', value: 90 }
  },
  {
    id: 'streak_180',
    name: 'Half-Year Legend',
    description: 'Maintain a 180-day streak on any habit',
    icon: '🏆',
    category: 'streak',
    tier: 'platinum',
    criteria: { type: 'streak', value: 180 }
  },
  {
    id: 'streak_365',
    name: 'Year of Discipline',
    description: 'Maintain a 365-day streak on any habit',
    icon: '💎',
    category: 'streak',
    tier: 'diamond',
    criteria: { type: 'streak', value: 365 }
  },

  // === COMPLETION BADGES ===
  {
    id: 'first_completion',
    name: 'First Step',
    description: 'Complete your first habit',
    icon: '🌱',
    category: 'completion',
    tier: 'bronze',
    criteria: { type: 'first_completion', value: 1 }
  },
  {
    id: 'completions_10',
    name: 'Getting Started',
    description: 'Complete habits 10 times',
    icon: '📈',
    category: 'completion',
    tier: 'bronze',
    criteria: { type: 'total_completions', value: 10 }
  },
  {
    id: 'completions_50',
    name: 'Building Momentum',
    description: 'Complete habits 50 times',
    icon: '🚀',
    category: 'completion',
    tier: 'silver',
    criteria: { type: 'total_completions', value: 50 }
  },
  {
    id: 'completions_100',
    name: 'Century Club',
    description: 'Complete habits 100 times',
    icon: '💯',
    category: 'completion',
    tier: 'silver',
    criteria: { type: 'total_completions', value: 100 }
  },
  {
    id: 'completions_500',
    name: 'Habit Machine',
    description: 'Complete habits 500 times',
    icon: '⚙️',
    category: 'completion',
    tier: 'gold',
    criteria: { type: 'total_completions', value: 500 }
  },
  {
    id: 'completions_1000',
    name: 'Legendary',
    description: 'Complete habits 1000 times',
    icon: '🌟',
    category: 'completion',
    tier: 'platinum',
    criteria: { type: 'total_completions', value: 1000 }
  },

  // === CONSISTENCY BADGES ===
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete all habits every day for a week',
    icon: '📅',
    category: 'consistency',
    tier: 'silver',
    criteria: { type: 'perfect_week', value: 1 }
  },
  {
    id: 'perfect_month',
    name: 'Flawless Month',
    description: 'Complete all habits every day for a month',
    icon: '🗓️',
    category: 'consistency',
    tier: 'gold',
    criteria: { type: 'perfect_month', value: 1 }
  },

  // === SOCIAL BADGES ===
  {
    id: 'first_share',
    name: 'Social Butterfly',
    description: 'Share your first habit with a friend',
    icon: '🤝',
    category: 'social',
    tier: 'bronze',
    criteria: { type: 'shares', value: 1 }
  },
  {
    id: 'buddy_streak_7',
    name: 'Buddy Bond',
    description: 'Achieve a 7-day shared streak with a buddy',
    icon: '👯',
    category: 'social',
    tier: 'silver',
    criteria: { type: 'buddy_streak', value: 7 }
  },
  {
    id: 'buddy_streak_30',
    name: 'Accountability Partners',
    description: 'Achieve a 30-day shared streak with a buddy',
    icon: '🎯',
    category: 'social',
    tier: 'gold',
    criteria: { type: 'buddy_streak', value: 30 }
  },

  // === SPECIAL BADGES ===
  {
    id: 'habits_3',
    name: 'Triple Threat',
    description: 'Create and maintain 3 active habits',
    icon: '🎪',
    category: 'special',
    tier: 'bronze',
    criteria: { type: 'habits_created', value: 3 }
  },
  {
    id: 'habits_5',
    name: 'High Five',
    description: 'Create and maintain 5 active habits',
    icon: '🖐️',
    category: 'special',
    tier: 'silver',
    criteria: { type: 'habits_created', value: 5 }
  },
  {
    id: 'habits_10',
    name: 'Overachiever',
    description: 'Create and maintain 10 active habits',
    icon: '🎖️',
    category: 'special',
    tier: 'gold',
    criteria: { type: 'habits_created', value: 10 }
  },
];

// Helper to get badge by ID
export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGES.find(badge => badge.id === id);
};

// Get badges by category
export const getBadgesByCategory = (category: BadgeDefinition['category']): BadgeDefinition[] => {
  return BADGES.filter(badge => badge.category === category);
};

// Get tier color for styling
export const getTierColor = (tier: BadgeDefinition['tier']): string => {
  switch (tier) {
    case 'bronze': return 'text-amber-600';
    case 'silver': return 'text-gray-400';
    case 'gold': return 'text-yellow-400';
    case 'platinum': return 'text-cyan-300';
    case 'diamond': return 'text-purple-400';
    default: return 'text-gray-400';
  }
};

export const getTierBgColor = (tier: BadgeDefinition['tier']): string => {
  switch (tier) {
    case 'bronze': return 'bg-amber-600/20 border-amber-600/50';
    case 'silver': return 'bg-gray-400/20 border-gray-400/50';
    case 'gold': return 'bg-yellow-400/20 border-yellow-400/50';
    case 'platinum': return 'bg-cyan-300/20 border-cyan-300/50';
    case 'diamond': return 'bg-purple-400/20 border-purple-400/50';
    default: return 'bg-gray-400/20 border-gray-400/50';
  }
};


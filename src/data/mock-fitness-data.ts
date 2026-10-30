export interface UserProfile {
  username: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  currentStreak: number;
  recentAchievements: string[];
}

export interface Review {
  reviewId: string;
  username: string;
  avatarUrl: string;
  starRating: number;
  reviewText: string;
  datePosted: string;
}

export interface WorkoutPost {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  contentTitle: string;
  contentDescription: string;
  thumbnailUrl: string;
  timestamp: string;
  metrics: {
    likes: string;
    comments: string;
    shares: string;
  };
}

export const currentUser: UserProfile = {
  username: "@fit_creator",
  bio: "Pushing limits every single day. Join me on the journey to peak performance.",
  followerCount: 14200,
  followingCount: 340,
  currentStreak: 42,
  recentAchievements: ["Iron Lungs", "Early Bird", "30-Day Warrior"],
};

export const leaderboardUsers: UserProfile[] = [
  {
    username: "@sarah_sweats",
    bio: "Cardio queen.",
    followerCount: 22100,
    followingCount: 412,
    currentStreak: 104,
    recentAchievements: ["Century Club", "Speed Demon"],
  },
  {
    username: "@jake_lifts",
    bio: "Heavy weights, light heart.",
    followerCount: 18500,
    followingCount: 120,
    currentStreak: 88,
    recentAchievements: ["Heavyweight", "Consistency is Key"],
  },
  {
    username: "@yoga_mia",
    bio: "Mindfulness and mobility.",
    followerCount: 30400,
    followingCount: 890,
    currentStreak: 76,
    recentAchievements: ["Zen Master", "Flexibility Guru"],
  },
];

export const workoutFeed: WorkoutPost[] = [
  {
    id: "post_1",
    authorName: "Sarah Sweats",
    authorAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "HIIT Torch Session",
    contentDescription: "A brutal 30-minute full-body HIIT workout that will leave you absolutely drenched. No equipment required, just pure grit.",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "2 hours ago",
    metrics: { likes: "1.2k", comments: "84", shares: "12" },
  },
  {
    id: "post_2",
    authorName: "Jake Lifts",
    authorAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Back & Biceps Hypertrophy",
    contentDescription: "Focused on time-under-tension today. Slow negatives are the secret to growth. Try this routine and feel the pump.",
    thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "4 hours ago",
    metrics: { likes: "3.4k", comments: "212", shares: "45" },
  },
  {
    id: "post_3",
    authorName: "Mia Flow",
    authorAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Morning Mobility Flow",
    contentDescription: "Start your day right with this 15-minute gentle yoga sequence. Perfect for opening up tight hips and shoulders.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "6 hours ago",
    metrics: { likes: "890", comments: "45", shares: "8" },
  },
  {
    id: "post_4",
    authorName: "Coach Marcus",
    authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Explosive Plyometrics",
    contentDescription: "Building athletic power. Box jumps, broad jumps, and medicine ball slams. This one requires serious energy.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526506114642-903c5ea4006c?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "8 hours ago",
    metrics: { likes: "2.1k", comments: "105", shares: "34" },
  },
  {
    id: "post_5",
    authorName: "Elena Fit",
    authorAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Core Crusher",
    contentDescription: "10 minutes of non-stop ab work. If you want a strong foundation, you can't skip the core. Let's get it done.",
    thumbnailUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "12 hours ago",
    metrics: { likes: "4.5k", comments: "320", shares: "110" },
  },
  {
    id: "post_6",
    authorName: "David Runs",
    authorAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Tempo Run Preparation",
    contentDescription: "Getting the legs ready for marathon season. Remember to maintain a conversational pace for the first half.",
    thumbnailUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "18 hours ago",
    metrics: { likes: "950", comments: "62", shares: "15" },
  },
  {
    id: "post_7",
    authorName: "Iron Will",
    authorAvatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Deadlift PR Day",
    contentDescription: "Finally broke through my plateau! 405lbs for a solid double. The programming is finally paying off.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "1 day ago",
    metrics: { likes: "5.2k", comments: "410", shares: "85" },
  },
  {
    id: "post_8",
    authorName: "Chloe Calisthenics",
    authorAvatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Muscle-up Progressions",
    contentDescription: "Mastering the false grip and explosive pull. It takes time, but the feeling of getting over the bar is unmatched.",
    thumbnailUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "1 day ago",
    metrics: { likes: "2.8k", comments: "150", shares: "40" },
  },
  {
    id: "post_9",
    authorName: "Recovery Room",
    authorAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Active Recovery Protocol",
    contentDescription: "Foam rolling and dynamic stretching to flush the legs. Don't underestimate the power of a good recovery day.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "2 days ago",
    metrics: { likes: "1.1k", comments: "45", shares: "22" },
  },
  {
    id: "post_10",
    authorName: "Zack Shreds",
    authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    contentTitle: "Kettlebell Flow",
    contentDescription: "Connecting movements seamlessly. This flow targets strength, coordination, and cardiovascular endurance.",
    thumbnailUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=600&h=800",
    timestamp: "2 days ago",
    metrics: { likes: "1.8k", comments: "95", shares: "30" },
  }
];

export const reviewsData: Review[] = [
  {
    reviewId: "rev_1",
    username: "Alex_H",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 5.0,
    reviewText: "Honestly the most fluid app I've used. The streak feature totally keeps me accountable, and the workouts are perfectly timed.",
    datePosted: "Oct 12, 2026"
  },
  {
    reviewId: "rev_2",
    username: "Sammy_Fit",
    avatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 5.0,
    reviewText: "The dark mode aesthetics are top tier. I actually look forward to opening this app every morning to see the new daily challenges.",
    datePosted: "Oct 10, 2026"
  },
  {
    reviewId: "rev_3",
    username: "JordanK",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 4.0,
    reviewText: "Really solid experience overall. The community feed is great for motivation. My only minor gripe is I wish I could filter the feed by specific muscle groups rather than just chronologically.",
    datePosted: "Oct 08, 2026"
  },
  {
    reviewId: "rev_4",
    username: "Riley_Runner",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 5.0,
    reviewText: "Confetti on workout complete is the dopamine hit I didn't know I needed! Gamification done perfectly.",
    datePosted: "Oct 05, 2026"
  },
  {
    reviewId: "rev_5",
    username: "Casey_Lifts",
    avatarUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 4.5,
    reviewText: "The user profiles feel so premium. Being able to see my friends' streaks motivates me to not break mine. The UI is incredibly smooth.",
    datePosted: "Oct 02, 2026"
  },
  {
    reviewId: "rev_6",
    username: "Morgan_T",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 3.5,
    reviewText: "Great app, but the infinite scroll sometimes resets if I switch to another app and come back. Would love if it saved my exact scroll position. Otherwise, fantastic workouts.",
    datePosted: "Sep 29, 2026"
  },
  {
    reviewId: "rev_7",
    username: "Taylor_Sweats",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 5.0,
    reviewText: "Hands down the best fitness UI out there. It doesn't feel like a spreadsheet like other apps; it feels alive and community-driven.",
    datePosted: "Sep 25, 2026"
  },
  {
    reviewId: "rev_8",
    username: "Chris_V",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    starRating: 5.0,
    reviewText: "I've tried 10 different fitness trackers and this one actually got me to stick to a routine. The visual progress and badges are super addicting.",
    datePosted: "Sep 20, 2026"
  }
];

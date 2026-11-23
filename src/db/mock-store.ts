import type {
  Workout,
  Review,
  Follow,
  Collection,
  CollectionWithMeta,
  CustomPet,
  CustomExercise,
  ExerciseRow,
  Vibes,
} from "./schema";

const INITIAL_WORKOUTS: Workout[] = [
  {
    id: "w-001",
    author: "Maya Chen",
    authorHandle: "@mayamoves",
    avatarHue: 262,
    title: "Ultimate Looksmaxing Guide (Ep. 18)",
    description: "No bakwas transformation blueprint: posture alignment, jawline & neck aesthetics, and daily facial conditioning.",
    level: "Intermediate",
    durationMin: 31,
    kcal: 240,
    cover: "/thumbnails/thumbnail-looksmaxing.png",
    coverSeed: "mint",
    exercises: [
      { name: "Neck flexions", sets: 3, reps: "15" },
      { name: "Posture wall-angles", sets: 3, reps: "12" },
      { name: "Push-ups", sets: 3, reps: "12" },
      { name: "Yoga flow", sets: 1, reps: "6 min" },
    ],
    vibes: { cardio: 25, strength: 70, mobility: 85, intensity: 50, endurance: 45 },
    premium: false,
    likes: 1284,
    liked: true,
    ratingSum: 14,
    ratingCount: 3,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-002",
    author: "Jordan Okafor",
    authorHandle: "@jolifts",
    avatarHue: 152,
    title: "Calisthenics Beginners Full Guide",
    description: "Complete progression blueprint: chest, biceps, 6-pack abs, back & quad control without gym equipment.",
    level: "Beginner",
    durationMin: 17,
    kcal: 195,
    cover: "/thumbnails/thumbnail-calisthenics.png",
    coverSeed: "mint",
    exercises: [
      { name: "Push-ups", sets: 4, reps: "15" },
      { name: "Pull-ups", sets: 3, reps: "8" },
      { name: "Bodyweight squats", sets: 4, reps: "20" },
      { name: "Plank hold", sets: 3, reps: "45s" },
    ],
    vibes: { cardio: 45, strength: 85, mobility: 60, intensity: 70, endurance: 65 },
    premium: false,
    likes: 962,
    liked: false,
    ratingSum: 14,
    ratingCount: 3,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-003",
    author: "Sofía Reyes",
    authorHandle: "@sofi_sweats",
    avatarHue: 12,
    title: "Teen Gains Hypertrophy Split",
    description: "High-yield bicep, chest, and back hypertrophy routine tailored for natural lifters aiming for aesthetic symmetry.",
    level: "Intermediate",
    durationMin: 8,
    kcal: 160,
    cover: "/thumbnails/thumbnail-teen-gains.png",
    coverSeed: "sunset",
    exercises: [
      { name: "Bicep dumbbell curls", sets: 4, reps: "12" },
      { name: "Dumbbell press", sets: 4, reps: "10" },
      { name: "Pike push-ups", sets: 3, reps: "8" },
    ],
    vibes: { cardio: 25, strength: 95, mobility: 30, intensity: 80, endurance: 50 },
    premium: false,
    likes: 743,
    liked: false,
    ratingSum: 9,
    ratingCount: 2,
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-004",
    author: "Kenji Tanaka",
    authorHandle: "@kenjiflow",
    avatarHue: 196,
    title: "3-Day Aesthetic Split Transformation",
    description: "Upper body mass & shredded midsection: Day 1 Chest & Delts, Day 2 Core & Serratus, Day 3 Obliques & Arms.",
    level: "Advanced",
    durationMin: 10,
    kcal: 180,
    cover: "/thumbnails/thumbnail-transformation.png",
    coverSeed: "lilac",
    exercises: [
      { name: "Incline push-ups", sets: 4, reps: "12" },
      { name: "Hanging leg raises", sets: 3, reps: "15" },
      { name: "Plank side crunches", sets: 3, reps: "20" },
    ],
    vibes: { cardio: 35, strength: 90, mobility: 40, intensity: 85, endurance: 65 },
    premium: false,
    likes: 512,
    liked: false,
    ratingSum: 14,
    ratingCount: 3,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-005",
    author: "Alex Rivera",
    authorHandle: "@alex.cardio",
    avatarHue: 332,
    title: "The 300-Rep Calisthenics Gauntlet",
    description: "Burpees, climbers, squats. Count down from 100. Your pet is watching.",
    level: "Elite",
    durationMin: 48,
    kcal: 610,
    cover: "/thumbnails/thumbnail-calisthenics.png",
    coverSeed: "sunset",
    exercises: [
      { name: "Burpees", sets: 5, reps: "20" },
      { name: "Climbers", sets: 5, reps: "40" },
      { name: "Squats", sets: 5, reps: "40" },
    ],
    vibes: { cardio: 95, strength: 60, mobility: 25, intensity: 100, endurance: 95 },
    premium: true,
    likes: 2311,
    liked: false,
    ratingSum: 14,
    ratingCount: 3,
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-006",
    author: "Priya Nair",
    authorHandle: "@priyapower",
    avatarHue: 96,
    title: "Looksmaxing & Posture Masterclass",
    description: "Tempo reps on the hinge and thoracic extension. Feel every single one.",
    level: "Advanced",
    durationMin: 38,
    kcal: 360,
    cover: "/thumbnails/thumbnail-looksmaxing.png",
    coverSeed: "mint",
    exercises: [
      { name: "KB swings", sets: 5, reps: "15" },
      { name: "Lunges", sets: 4, reps: "12/side" },
      { name: "Squats", sets: 4, reps: "15" },
    ],
    vibes: { cardio: 35, strength: 90, mobility: 45, intensity: 75, endurance: 60 },
    premium: false,
    likes: 894,
    liked: true,
    ratingSum: 9,
    ratingCount: 2,
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-007",
    author: "Priya Nair",
    authorHandle: "@priyapower",
    avatarHue: 96,
    title: "Iron Hinge & Arms Masterclass",
    description: "Pro track: posterior chain perfection with pause reps and tempo swings.",
    level: "Elite",
    durationMin: 55,
    kcal: 480,
    cover: "/thumbnails/thumbnail-teen-gains.png",
    coverSeed: "mint",
    exercises: [
      { name: "KB swings", sets: 6, reps: "20" },
      { name: "Romanian hinge", sets: 5, reps: "8" },
      { name: "Plank hold", sets: 3, reps: "75s" },
    ],
    vibes: { cardio: 40, strength: 95, mobility: 50, intensity: 85, endurance: 70 },
    premium: true,
    likes: 1988,
    liked: true,
    ratingSum: 10,
    ratingCount: 2,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-008",
    author: "Sofía Reyes",
    authorHandle: "@sofi_sweats",
    avatarHue: 12,
    title: "3-Day Physique Sculpt",
    description: "Pro track: 30 minutes of high-tempo aesthetic movement.",
    level: "Beginner",
    durationMin: 30,
    kcal: 300,
    cover: "/thumbnails/thumbnail-transformation.png",
    coverSeed: "lilac",
    exercises: [
      { name: "Dance intervals", sets: 6, reps: "4 min" },
      { name: "Climbers", sets: 2, reps: "20" },
    ],
    vibes: { cardio: 90, strength: 20, mobility: 65, intensity: 55, endurance: 75 },
    premium: true,
    likes: 1756,
    liked: false,
    ratingSum: 10,
    ratingCount: 2,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-009",
    author: "Zane Masterson",
    authorHandle: "@zane_calisthenics",
    avatarHue: 42,
    title: "Gravity Defying Calisthenics",
    description: "Master your bodyweight. Static holds and core crushers. L-Sit into Planche.",
    level: "Elite",
    durationMin: 45,
    kcal: 400,
    cover: "/thumbnails/thumbnail-calisthenics.png",
    coverSeed: "cloud",
    exercises: [
      { name: "Handstand", sets: 3, reps: "30s" },
      { name: "Calisthenics hold", sets: 4, reps: "45s" },
      { name: "Planche hold", sets: 3, reps: "15s" },
    ],
    vibes: { cardio: 20, strength: 100, mobility: 60, intensity: 90, endurance: 80 },
    premium: true,
    likes: 3412,
    liked: false,
    ratingSum: 25,
    ratingCount: 5,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "w-010",
    author: "Elena Petrova",
    authorHandle: "@elena_yogi",
    avatarHue: 190,
    title: "Advanced Looksmaxing & Yoga Flow",
    description: "Deep arm balances and intense core integration. Crow pose and Boat pose sequence.",
    level: "Advanced",
    durationMin: 35,
    kcal: 220,
    cover: "/thumbnails/thumbnail-looksmaxing.png",
    coverSeed: "sky",
    exercises: [
      { name: "Yoga balance", sets: 1, reps: "10 min" },
      { name: "Advanced Yoga flow", sets: 1, reps: "15 min" },
      { name: "Crow pose", sets: 3, reps: "30s" },
      { name: "Boat pose", sets: 3, reps: "45s" },
    ],
    vibes: { cardio: 10, strength: 50, mobility: 100, intensity: 45, endurance: 60 },
    premium: false,
    likes: 1845,
    liked: true,
    ratingSum: 19,
    ratingCount: 4,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: "r-001",
    workoutId: "w-001",
    author: "Tessa",
    rating: 5,
    comment: "Genuinely woke me up better than espresso. Doing it daily.",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "r-002",
    workoutId: "w-001",
    author: "Marco",
    rating: 4,
    comment: "Great flow, wish the last block was a touch longer.",
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
  {
    id: "r-003",
    workoutId: "w-001",
    author: "Ivy",
    rating: 5,
    comment: "Perfect for mornings when motivation is nowhere to be found.",
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: "r-004",
    workoutId: "w-002",
    author: "Devon",
    rating: 5,
    comment: "My forearms filed a complaint. Worth it.",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "r-005",
    workoutId: "w-002",
    author: "Sam",
    rating: 4,
    comment: "Brutal but well paced. Round 4 is where it gets real.",
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    id: "r-006",
    workoutId: "w-005",
    author: "Yuki",
    rating: 5,
    comment: "Absolutely savage. Finished on the floor. 10/10.",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_FOLLOWS: Follow[] = [
  { handle: "@mayamoves", author: "Maya Chen", avatarHue: 262, createdAt: new Date().toISOString() },
  { handle: "@jolifts", author: "Jordan Okafor", avatarHue: 152, createdAt: new Date().toISOString() },
  { handle: "@priyapower", author: "Priya Nair", avatarHue: 96, createdAt: new Date().toISOString() },
];

const INITIAL_COLLECTIONS: Collection[] = [
  { id: "col-1", name: "Morning Routines", emoji: "🌅", createdAt: new Date().toISOString() },
  { id: "col-2", name: "Leg Day Favorites", emoji: "🦵", createdAt: new Date().toISOString() },
  { id: "col-3", name: "Quick HIIT", emoji: "⚡", createdAt: new Date().toISOString() },
];

const INITIAL_EXERCISES: CustomExercise[] = [
  {
    id: "ex-1",
    name: "Kettlebell Swing",
    emoji: "🔔",
    tag: "strength",
    vibes: { cardio: 70, strength: 80, mobility: 40, intensity: 75, endurance: 70 },
    mode: "reps",
    defaultSets: 4,
    defaultReps: 15,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-2",
    name: "Pike Push-Up",
    emoji: "🤸",
    tag: "calisthenics",
    vibes: { cardio: 30, strength: 85, mobility: 60, intensity: 70, endurance: 50 },
    mode: "reps",
    defaultSets: 3,
    defaultReps: 10,
    defaultSeconds: 30,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-3",
    name: "Squats",
    emoji: "🦵",
    tag: "strength",
    vibes: { cardio: 50, strength: 85, mobility: 50, intensity: 65, endurance: 70 },
    mode: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-4",
    name: "Push-ups",
    emoji: "💪",
    tag: "calisthenics",
    vibes: { cardio: 30, strength: 80, mobility: 20, intensity: 60, endurance: 50 },
    mode: "reps",
    defaultSets: 3,
    defaultReps: 12,
    defaultSeconds: 30,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-5",
    name: "Climbers",
    emoji: "🏃",
    tag: "cardio",
    vibes: { cardio: 90, strength: 40, mobility: 30, intensity: 85, endurance: 80 },
    mode: "reps",
    defaultSets: 3,
    defaultReps: 20,
    defaultSeconds: 30,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-6",
    name: "Yoga flow",
    emoji: "🧘",
    tag: "mobility",
    vibes: { cardio: 20, strength: 30, mobility: 95, intensity: 20, endurance: 40 },
    mode: "time",
    defaultSets: 1,
    defaultReps: 1,
    defaultSeconds: 360,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-7",
    name: "KB swings",
    emoji: "🏋️",
    tag: "strength",
    vibes: { cardio: 80, strength: 85, mobility: 40, intensity: 85, endurance: 75 },
    mode: "reps",
    defaultSets: 5,
    defaultReps: 15,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-8",
    name: "Lunges",
    emoji: "🦵",
    tag: "strength",
    vibes: { cardio: 40, strength: 75, mobility: 55, intensity: 60, endurance: 65 },
    mode: "reps",
    defaultSets: 4,
    defaultReps: 12,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-9",
    name: "Plank hold",
    emoji: "🛡️",
    tag: "core",
    vibes: { cardio: 10, strength: 80, mobility: 10, intensity: 65, endurance: 85 },
    mode: "time",
    defaultSets: 3,
    defaultReps: 1,
    defaultSeconds: 60,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-10",
    name: "Dumbbell press",
    emoji: "🏋️",
    tag: "strength",
    vibes: { cardio: 20, strength: 90, mobility: 20, intensity: 75, endurance: 55 },
    mode: "reps",
    defaultSets: 4,
    defaultReps: 10,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-11",
    name: "Burpees",
    emoji: "🔥",
    tag: "cardio",
    vibes: { cardio: 95, strength: 65, mobility: 40, intensity: 100, endurance: 90 },
    mode: "reps",
    defaultSets: 3,
    defaultReps: 15,
    defaultSeconds: 60,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-12",
    name: "Romanian hinge",
    emoji: "🍑",
    tag: "strength",
    vibes: { cardio: 30, strength: 85, mobility: 55, intensity: 70, endurance: 60 },
    mode: "reps",
    defaultSets: 4,
    defaultReps: 10,
    defaultSeconds: 45,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ex-13",
    name: "Dance intervals",
    emoji: "💃",
    tag: "cardio",
    vibes: { cardio: 95, strength: 20, mobility: 65, intensity: 60, endurance: 80 },
    mode: "time",
    defaultSets: 5,
    defaultReps: 1,
    defaultSeconds: 240,
    animationId: null,
    animationName: null,
    animationKind: null,
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_PETS: CustomPet[] = [
  {
    id: "pet-1",
    name: "Mochi",
    bio: "Always hyping your morning squats",
    personality: "playful",
    furHex: "#7fe7bb",
    assetId: null,
    assetName: null,
    assetKind: null,
    createdAt: new Date().toISOString(),
  },
];

class MockStore {
  private workouts: Workout[] = [...INITIAL_WORKOUTS];
  private reviews: Review[] = [...INITIAL_REVIEWS];
  private follows: Follow[] = [...INITIAL_FOLLOWS];
  private collections: Collection[] = [...INITIAL_COLLECTIONS];
  private exercises: CustomExercise[] = [...INITIAL_EXERCISES];
  private pets: CustomPet[] = [...INITIAL_PETS];

  getFeed(cursor: string | null, limit: number) {
    let items = [...this.workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (cursor) {
      const [ts, id] = cursor.split("|");
      const cursorTime = new Date(ts).getTime();
      items = items.filter((w) => {
        const itemTime = new Date(w.createdAt).getTime();
        if (itemTime < cursorTime) return true;
        if (itemTime === cursorTime && w.id < id) return true;
        return false;
      });
    }

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    const last = pageItems[pageItems.length - 1];

    return {
      items: pageItems,
      nextCursor: hasMore && last ? `${last.createdAt}|${last.id}` : null,
    };
  }

  getWorkoutById(id: string) {
    return this.workouts.find((w) => w.id === id) || null;
  }

  getWorkoutsByHandle(handle: string) {
    return this.workouts.filter((w) => w.authorHandle === handle);
  }

  toggleLike(id: string, liked: boolean) {
    const w = this.workouts.find((item) => item.id === id);
    if (!w) return null;
    w.liked = liked;
    w.likes = Math.max(0, w.likes + (liked ? 1 : -1));
    return { likes: w.likes, liked: w.liked };
  }

  addWorkout(payload: { title: string; exercises: ExerciseRow[]; vibes: Vibes }) {
    const totalSets = payload.exercises.reduce((acc, e) => acc + e.sets, 0);
    const durationMin = Math.max(5, Math.round(totalSets * 1.6));
    const levels = ["Beginner", "Intermediate", "Advanced", "Elite"] as const;
    const level = levels[Math.min(3, Math.floor(totalSets / 8))];

    const newWorkout: Workout = {
      id: `w-${Date.now()}`,
      author: "You",
      authorHandle: "@you",
      avatarHue: 268,
      title: payload.title.slice(0, 60),
      description: `Built in the vyay Studio — ${payload.exercises.length} moves, ${totalSets} sets.`,
      level,
      durationMin,
      kcal: durationMin * 8,
      cover: null,
      coverSeed: ["mint", "lilac", "sunset", "sky", "cloud"][Math.floor(Math.random() * 5)],
      exercises: payload.exercises,
      vibes: payload.vibes,
      premium: false,
      likes: 0,
      liked: false,
      ratingSum: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.workouts.unshift(newWorkout);
    return newWorkout;
  }

  getReviews(workoutId: string) {
    const itemReviews = this.reviews
      .filter((r) => r.workoutId === workoutId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of itemReviews) {
      const idx = Math.min(5, Math.max(1, r.rating)) - 1;
      distribution[idx] += 1;
      sum += r.rating;
    }

    return {
      items: itemReviews,
      count: itemReviews.length,
      average: itemReviews.length ? sum / itemReviews.length : 0,
      distribution,
    };
  }

  addReview(workoutId: string, rating: number, comment: string, author: string) {
    const w = this.workouts.find((item) => item.id === workoutId);
    if (!w) return null;

    const newReview: Review = {
      id: `r-${Date.now()}`,
      workoutId,
      rating,
      comment,
      author,
      createdAt: new Date().toISOString(),
    };

    this.reviews.unshift(newReview);
    w.ratingSum += rating;
    w.ratingCount += 1;

    return newReview;
  }

  getFollows() {
    return this.follows.map((f) => {
      const authorWorkouts = this.workouts.filter((w) => w.authorHandle === f.handle);
      return {
        ...f,
        workoutCount: authorWorkouts.length,
        likeCount: authorWorkouts.reduce((acc, w) => acc + w.likes, 0),
      };
    });
  }

  addFollow(handle: string, author: string, avatarHue: number) {
    const existingIndex = this.follows.findIndex((f) => f.handle === handle);
    const newFollow: Follow = {
      handle,
      author,
      avatarHue,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.follows[existingIndex] = newFollow;
    } else {
      this.follows.push(newFollow);
    }
    return newFollow;
  }

  removeFollow(handle: string) {
    this.follows = this.follows.filter((f) => f.handle !== handle);
    return { handle };
  }

  getCollections() {
    return this.collections.map((c) => ({
      ...c,
      count: this.workouts.length > 0 ? 2 : 0,
      covers: this.workouts.slice(0, 3).map((w) => ({ cover: w.cover, coverSeed: w.coverSeed })),
    }));
  }

  addCollection(name: string, emoji: string): CollectionWithMeta {
    const col: Collection = {
      id: `col-${Date.now()}`,
      name,
      emoji,
      createdAt: new Date().toISOString(),
    };
    this.collections.unshift(col);
    return { ...col, count: 0, covers: [] };
  }

  getExercises() {
    return this.exercises;
  }

  addExercise(ex: Omit<CustomExercise, "id" | "createdAt">) {
    const newEx: CustomExercise = {
      ...ex,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.exercises.unshift(newEx);
    return newEx;
  }

  getPets() {
    return this.pets;
  }

  addPet(pet: Omit<CustomPet, "id" | "createdAt">) {
    const newPet: CustomPet = {
      ...pet,
      id: `pet-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.pets.unshift(newPet);
    return newPet;
  }
}

export const mockStore = new MockStore();

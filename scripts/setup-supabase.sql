-- ==============================================================================
-- Vyay Database Setup & Seed Script for Supabase PostgreSQL
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create tables
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  avatar_hue INTEGER NOT NULL DEFAULT 160,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Beginner',
  duration_min INTEGER NOT NULL DEFAULT 20,
  kcal INTEGER NOT NULL DEFAULT 0,
  cover TEXT,
  cover_seed TEXT NOT NULL DEFAULT 'mint',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  vibes JSONB NOT NULL DEFAULT '{"cardio":50,"strength":50,"mobility":40,"intensity":50,"endurance":45}'::jsonb,
  premium BOOLEAN NOT NULL DEFAULT false,
  likes INTEGER NOT NULL DEFAULT 0,
  liked BOOLEAN NOT NULL DEFAULT false,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workouts_created_id_idx ON workouts (created_at, id);

CREATE TABLE IF NOT EXISTS follows (
  handle TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  avatar_hue INTEGER NOT NULL DEFAULT 160,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collection_items_unique UNIQUE (collection_id, workout_id)
);

CREATE INDEX IF NOT EXISTS collection_items_workout_idx ON collection_items (workout_id);

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT 'playful',
  fur_hex TEXT NOT NULL DEFAULT '#7fe7bb',
  asset_id UUID,
  asset_name TEXT,
  asset_kind TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💪',
  tag TEXT NOT NULL DEFAULT 'custom',
  vibes JSONB NOT NULL DEFAULT '{"cardio":50,"strength":50,"mobility":40,"intensity":50,"endurance":45}'::jsonb,
  mode TEXT NOT NULL DEFAULT 'reps',
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER NOT NULL DEFAULT 12,
  default_seconds INTEGER NOT NULL DEFAULT 45,
  animation_id UUID,
  animation_name TEXT,
  animation_kind TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_workout_idx ON reviews (workout_id, created_at);

CREATE TABLE IF NOT EXISTS animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Reset & Seed Workouts
TRUNCATE TABLE workouts CASCADE;

INSERT INTO workouts
  (author, author_handle, avatar_hue, title, description, level, duration_min, kcal, cover, cover_seed, exercises, premium, likes, liked, created_at)
VALUES
  ('Maya Chen', '@mayamoves', 262, 'Ultimate Looksmaxing Guide (Ep. 18)',
   'No bakwas transformation blueprint: posture alignment, jawline & neck aesthetics, and daily facial conditioning.',
   'Intermediate', 31, 240,
   '/thumbnails/thumbnail-looksmaxing.png',
   'mint',
   '[{"name":"Neck flexions","sets":3,"reps":"15"},{"name":"Posture wall-angles","sets":3,"reps":"12"},{"name":"Push-ups","sets":3,"reps":"12"}]'::jsonb,
   false, 1284, true, now() - interval '2 hours'),

  ('Jordan Okafor', '@jolifts', 152, 'Calisthenics Beginners Full Guide',
   'Complete progression blueprint: chest, biceps, 6-pack abs, back & quad control without gym equipment.',
   'Beginner', 17, 195,
   '/thumbnails/thumbnail-calisthenics.png',
   'mint',
   '[{"name":"Push-ups","sets":4,"reps":"15"},{"name":"Pull-ups","sets":3,"reps":"8"},{"name":"Bodyweight squats","sets":4,"reps":"20"},{"name":"Plank hold","sets":3,"reps":"45s"}]'::jsonb,
   false, 962, false, now() - interval '5 hours'),

  ('Sofía Reyes', '@sofi_sweats', 12, 'Teen Gains Hypertrophy Split',
   'High-yield bicep, chest, and back hypertrophy routine tailored for natural lifters aiming for aesthetic symmetry.',
   'Intermediate', 8, 160,
   '/thumbnails/thumbnail-teen-gains.png',
   'sunset',
   '[{"name":"Bicep dumbbell curls","sets":4,"reps":"12"},{"name":"Dumbbell press","sets":4,"reps":"10"},{"name":"Pike push-ups","sets":3,"reps":"8"}]'::jsonb,
   false, 743, false, now() - interval '9 hours'),

  ('Kenji Tanaka', '@kenjiflow', 196, '3-Day Aesthetic Split Transformation',
   'Upper body mass & shredded midsection: Day 1 Chest & Delts, Day 2 Core & Serratus, Day 3 Obliques & Arms.',
   'Advanced', 10, 180,
   '/thumbnails/thumbnail-transformation.png',
   'lilac',
   '[{"name":"Incline push-ups","sets":4,"reps":"12"},{"name":"Hanging leg raises","sets":3,"reps":"15"},{"name":"Plank side crunches","sets":3,"reps":"20"}]'::jsonb,
   false, 512, false, now() - interval '14 hours'),

  ('Alex Rivera', '@alex.cardio', 332, 'The 300-Rep Calisthenics Gauntlet',
   'Burpees, climbers, squats. Count down from 100. Your pet is watching.',
   'Elite', 48, 610,
   '/thumbnails/thumbnail-calisthenics.png',
   'sunset',
   '[{"name":"Burpees","sets":5,"reps":"20"},{"name":"Climbers","sets":5,"reps":"40"},{"name":"Squats","sets":5,"reps":"40"}]'::jsonb,
   true, 2311, false, now() - interval '22 hours'),

  ('Priya Nair', '@priyapower', 96, 'Glute Forge Vol. 2',
   'Tempo reps on the hinge. Feel every single one.',
   'Advanced', 38, 360, null, 'mint',
   '[{"name":"KB swings","sets":5,"reps":"15"},{"name":"Lunges","sets":4,"reps":"12/side"},{"name":"Squats","sets":4,"reps":"15"}]'::jsonb,
   false, 894, true, now() - interval '30 hours'),

  ('Maya Chen', '@mayamoves', 262, 'Lunch-Break Ladder',
   'Twelve minutes, one ladder, endless bragging rights.',
   'Beginner', 12, 140, null, 'sky',
   '[{"name":"Squats","sets":3,"reps":"10"},{"name":"Push-ups","sets":3,"reps":"6"},{"name":"Climbers","sets":3,"reps":"16"}]'::jsonb,
   false, 426, false, now() - interval '45 hours'),

  ('Jordan Okafor', '@jolifts', 152, 'Bench Press Meditation',
   'Heavy sets of five. Breathe between, suffer within.',
   'Advanced', 52, 340,
   'https://images.pexels.com/photos/3837754/pexels-photo-3837754.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'cloud',
   '[{"name":"Bench press","sets":5,"reps":"5"},{"name":"Dumbbell press","sets":3,"reps":"8"},{"name":"Plank hold","sets":3,"reps":"60s"}]'::jsonb,
   true, 1567, false, now() - interval '2 days'),

  ('Sofía Reyes', '@sofi_sweats', 12, 'Rope Burn Intervals',
   'Thirty on, thirty off. Eight rounds of beautiful chaos.',
   'Intermediate', 24, 320,
   'https://images.pexels.com/photos/3838705/pexels-photo-3838705.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'sunset',
   '[{"name":"Battle ropes","sets":8,"reps":"30s"},{"name":"Burpees","sets":4,"reps":"10"}]'::jsonb,
   false, 689, false, now() - interval '3 days'),

  ('Kenji Tanaka', '@kenjiflow', 196, 'Barefoot Balance Builder',
   'Ankles, knees, hips — teach them to trust each other again.',
   'Beginner', 16, 95, null, 'cloud',
   '[{"name":"Yoga flow","sets":3,"reps":"5 min"},{"name":"Lunges","sets":2,"reps":"8/side"}]'::jsonb,
   false, 358, false, now() - interval '4 days'),

  ('Alex Rivera', '@alex.cardio', 332, 'Stairwell Sprint Club',
   'Find a flight. Own it ten times. Membership is free.',
   'Advanced', 30, 410,
   'https://images.pexels.com/photos/20594792/pexels-photo-20594792.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'sky',
   '[{"name":"Stair sprints","sets":10,"reps":"1 flight"},{"name":"Climbers","sets":4,"reps":"30"}]'::jsonb,
   false, 1105, false, now() - interval '5 days'),

  ('Priya Nair', '@priyapower', 96, 'Iron Hinge Masterclass',
   'Pro track: posterior chain perfection with pause reps and tempo swings.',
   'Elite', 55, 480,
   'https://images.pexels.com/photos/6628962/pexels-photo-6628962.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'mint',
   '[{"name":"KB swings","sets":6,"reps":"20"},{"name":"Romanian hinge","sets":5,"reps":"8"},{"name":"Plank hold","sets":3,"reps":"75s"}]'::jsonb,
   true, 1988, true, now() - interval '6 days'),

  ('Maya Chen', '@mayamoves', 262, 'Desk Detox Microflow',
   'Seven moves you can do between meetings. Camera optional.',
   'Beginner', 9, 60, null, 'mint',
   '[{"name":"Yoga flow","sets":1,"reps":"6 min"},{"name":"Squats","sets":2,"reps":"10"}]'::jsonb,
   false, 297, false, now() - interval '7 days'),

  ('Jordan Okafor', '@jolifts', 152, 'Pull Day Cathedral',
   'Rows upon rows. Leave the ego at the door, bring lats home.',
   'Intermediate', 44, 355,
   'https://images.pexels.com/photos/3838335/pexels-photo-3838335.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'cloud',
   '[{"name":"Rows","sets":5,"reps":"10"},{"name":"Plank hold","sets":3,"reps":"45s"},{"name":"KB swings","sets":3,"reps":"12"}]'::jsonb,
   false, 812, false, now() - interval '8 days'),

  ('Sofía Reyes', '@sofi_sweats', 12, 'Core Before Dawn',
   'The house is asleep. Your abs are not invited.',
   'Intermediate', 20, 180, null, 'lilac',
   '[{"name":"Plank hold","sets":4,"reps":"60s"},{"name":"Climbers","sets":4,"reps":"24"},{"name":"Yoga flow","sets":1,"reps":"4 min"}]'::jsonb,
   false, 534, false, now() - interval '9 days'),

  ('Kenji Tanaka', '@kenjiflow', 196, 'Forest Walk + Flow',
   'Walk twenty minutes, flow for ten. Trees count as spotters.',
   'Beginner', 30, 150, null, 'sky',
   '[{"name":"Walk","sets":1,"reps":"20 min"},{"name":"Yoga flow","sets":1,"reps":"10 min"}]'::jsonb,
   false, 445, false, now() - interval '10 days'),

  ('Alex Rivera', '@alex.cardio', 332, 'EMOM 16: Engine Check',
   'Every minute on the minute. The clock is the coach.',
   'Advanced', 16, 260,
   'https://images.pexels.com/photos/15586268/pexels-photo-15586268.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'sunset',
   '[{"name":"Burpees","sets":8,"reps":"8"},{"name":"Squats","sets":8,"reps":"12"}]'::jsonb,
   false, 923, false, now() - interval '11 days'),

  ('Priya Nair', '@priyapower', 96, 'Sunday Long Lift',
   'Ninety minutes, full body, full focus. Bring snacks.',
   'Elite', 90, 720, null, 'cloud',
   '[{"name":"KB swings","sets":5,"reps":"15"},{"name":"Lunges","sets":5,"reps":"10/side"},{"name":"Push-ups","sets":5,"reps":"12"},{"name":"Plank hold","sets":4,"reps":"90s"}]'::jsonb,
   true, 1340, false, now() - interval '12 days'),

  ('Maya Chen', '@mayamoves', 262, 'Rainy Day Living-Room HIIT',
   'No gym, no problem. The couch is now equipment.',
   'Beginner', 25, 240, null, 'sunset',
   '[{"name":"Squats","sets":4,"reps":"15"},{"name":"Climbers","sets":4,"reps":"24"},{"name":"Push-ups","sets":4,"reps":"8"}]'::jsonb,
   false, 618, false, now() - interval '13 days'),

  ('Jordan Okafor', '@jolifts', 152, 'Grip Strength Secrets',
   'Hangs, carries, holds. Handshakes will fear you.',
   'Intermediate', 28, 210, null, 'mint',
   '[{"name":"Dead hang","sets":4,"reps":"40s"},{"name":"Farmer carry","sets":4,"reps":"30m"},{"name":"Plank hold","sets":3,"reps":"60s"}]'::jsonb,
   false, 701, false, now() - interval '14 days'),

  ('Sofía Reyes', '@sofi_sweats', 12, 'Dance Cardio Fiesta',
   'Pro track: 30 minutes of movement that forgets it is exercise.',
   'Beginner', 30, 300,
   'https://images.pexels.com/photos/2294400/pexels-photo-2294400.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
   'lilac',
   '[{"name":"Dance intervals","sets":6,"reps":"4 min"},{"name":"Climbers","sets":2,"reps":"20"}]'::jsonb,
   true, 1756, false, now() - interval '15 days'),

  ('Kenji Tanaka', '@kenjiflow', 196, 'Breath-First Conditioning',
   'Nasal breathing only. Slower heart, faster recovery.',
   'Beginner', 35, 190, null, 'sky',
   '[{"name":"Walk","sets":1,"reps":"25 min"},{"name":"Yoga flow","sets":2,"reps":"5 min"}]'::jsonb,
   false, 388, false, now() - interval '17 days'),

  ('Alex Rivera', '@alex.cardio', 332, 'Park Bench Superset',
   'Step-ups, dips, split squats. One bench, whole body.',
   'Intermediate', 26, 280, null, 'mint',
   '[{"name":"Step-ups","sets":4,"reps":"10/side"},{"name":"Bench dips","sets":4,"reps":"12"},{"name":"Lunges","sets":3,"reps":"8/side"}]'::jsonb,
   false, 567, false, now() - interval '19 days'),

  ('Priya Nair', '@priyapower', 96, 'Posterior Chain Power Week',
   'Day 3 of 7. The hinge never lies.',
   'Advanced', 40, 430, null, 'sunset',
   '[{"name":"KB swings","sets":6,"reps":"15"},{"name":"Romanian hinge","sets":4,"reps":"10"},{"name":"Climbers","sets":3,"reps":"30"}]'::jsonb,
   false, 845, false, now() - interval '21 days'),

  ('Maya Chen', '@mayamoves', 262, 'Leap Day Legs',
   'Jump squats optional. Regret guaranteed either way.',
   'Intermediate', 32, 350, null, 'cloud',
   '[{"name":"Squats","sets":5,"reps":"15"},{"name":"Lunges","sets":4,"reps":"10/side"},{"name":"Burpees","sets":3,"reps":"8"}]'::jsonb,
   false, 659, false, now() - interval '24 days'),

  ('Jordan Okafor', '@jolifts', 152, 'Minimalist Hotel Room WOD',
   'Travel-proof. Neighbor-proof (mostly). Excuse-proof.',
   'Beginner', 21, 200, null, 'lilac',
   '[{"name":"Push-ups","sets":4,"reps":"10"},{"name":"Squats","sets":4,"reps":"15"},{"name":"Plank hold","sets":3,"reps":"40s"}]'::jsonb,
   false, 492, false, now() - interval '28 days');

-- 4. Update Workout Vibes
UPDATE workouts SET vibes = v.vibes FROM (VALUES
  ('Sunrise Full-Body Charge',      '{"cardio":55,"strength":45,"mobility":70,"intensity":35,"endurance":45}'::jsonb),
  ('Kettlebell Engine Room',        '{"cardio":75,"strength":80,"mobility":30,"intensity":80,"endurance":75}'::jsonb),
  ('Push Day Poetry',               '{"cardio":25,"strength":90,"mobility":30,"intensity":70,"endurance":50}'::jsonb),
  ('Twilight Mobility Ritual',      '{"cardio":15,"strength":20,"mobility":95,"intensity":15,"endurance":30}'::jsonb),
  ('The 300-Rep Gauntlet',          '{"cardio":95,"strength":60,"mobility":25,"intensity":100,"endurance":95}'::jsonb),
  ('Glute Forge Vol. 2',            '{"cardio":35,"strength":90,"mobility":45,"intensity":75,"endurance":60}'::jsonb),
  ('Lunch-Break Ladder',            '{"cardio":65,"strength":40,"mobility":35,"intensity":50,"endurance":40}'::jsonb),
  ('Bench Press Meditation',        '{"cardio":15,"strength":100,"mobility":25,"intensity":80,"endurance":45}'::jsonb),
  ('Rope Burn Intervals',           '{"cardio":95,"strength":45,"mobility":25,"intensity":90,"endurance":80}'::jsonb),
  ('Barefoot Balance Builder',      '{"cardio":20,"strength":30,"mobility":90,"intensity":20,"endurance":35}'::jsonb),
  ('Stairwell Sprint Club',         '{"cardio":100,"strength":40,"mobility":20,"intensity":90,"endurance":85}'::jsonb),
  ('Iron Hinge Masterclass',        '{"cardio":40,"strength":95,"mobility":50,"intensity":85,"endurance":70}'::jsonb),
  ('Desk Detox Microflow',          '{"cardio":20,"strength":20,"mobility":85,"intensity":15,"endurance":25}'::jsonb),
  ('Pull Day Cathedral',            '{"cardio":25,"strength":90,"mobility":35,"intensity":70,"endurance":55}'::jsonb),
  ('Core Before Dawn',              '{"cardio":45,"strength":65,"mobility":45,"intensity":60,"endurance":70}'::jsonb),
  ('Forest Walk + Flow',            '{"cardio":45,"strength":15,"mobility":80,"intensity":20,"endurance":60}'::jsonb),
  ('EMOM 16: Engine Check',         '{"cardio":85,"strength":55,"mobility":25,"intensity":95,"endurance":80}'::jsonb),
  ('Sunday Long Lift',              '{"cardio":45,"strength":95,"mobility":45,"intensity":80,"endurance":100}'::jsonb),
  ('Rainy Day Living-Room HIIT',    '{"cardio":80,"strength":45,"mobility":35,"intensity":70,"endurance":60}'::jsonb),
  ('Grip Strength Secrets',         '{"cardio":20,"strength":85,"mobility":30,"intensity":65,"endurance":75}'::jsonb),
  ('Dance Cardio Fiesta',           '{"cardio":90,"strength":20,"mobility":65,"intensity":55,"endurance":75}'::jsonb),
  ('Breath-First Conditioning',     '{"cardio":55,"strength":15,"mobility":70,"intensity":25,"endurance":80}'::jsonb),
  ('Park Bench Superset',           '{"cardio":55,"strength":70,"mobility":40,"intensity":60,"endurance":55}'::jsonb),
  ('Posterior Chain Power Week',    '{"cardio":40,"strength":90,"mobility":50,"intensity":80,"endurance":70}'::jsonb),
  ('Leap Day Legs',                 '{"cardio":65,"strength":75,"mobility":40,"intensity":75,"endurance":65}'::jsonb),
  ('Minimalist Hotel Room WOD',     '{"cardio":60,"strength":50,"mobility":40,"intensity":50,"endurance":50}'::jsonb)
) AS v(title, vibes) WHERE workouts.title = v.title;

-- 5. Seed Reviews
TRUNCATE TABLE reviews CASCADE;

INSERT INTO reviews (workout_id, author, rating, comment, created_at)
SELECT w.id, r.author, r.rating, r.comment, now() - (r.hrs || ' hours')::interval
FROM workouts w
JOIN (VALUES
  ('Sunrise Full-Body Charge','Tessa',5,'Genuinely woke me up better than espresso. Doing it daily.',3),
  ('Sunrise Full-Body Charge','Marco',4,'Great flow, wish the last block was a touch longer.',9),
  ('Sunrise Full-Body Charge','Ivy',5,'Perfect for mornings when motivation is nowhere to be found.',20),
  ('Kettlebell Engine Room','Devon',5,'My forearms filed a complaint. Worth it.',6),
  ('Kettlebell Engine Room','Sam',4,'Brutal but well paced. Round 4 is where it gets real.',14),
  ('Kettlebell Engine Room','Nina',5,'Best conditioning session on here right now.',26),
  ('Push Day Poetry','Ravi',4,'Solid pump. Tempo cues would make it perfect.',11),
  ('Push Day Poetry','Elle',5,'Chest was toast by set three. Loved it.',30),
  ('Twilight Mobility Ritual','Kai',5,'Undid eight hours of desk damage in eighteen minutes.',7),
  ('Twilight Mobility Ritual','Bea',5,'So calming. Now part of my bedtime routine.',33),
  ('Twilight Mobility Ritual','Otto',4,'Lovely, though I wanted more hip work.',48),
  ('The 300-Rep Gauntlet','Yuki',5,'Absolutely savage. Finished on the floor. 10/10.',12),
  ('The 300-Rep Gauntlet','Pablo',4,'Elite is right. Scale it if you value your legs.',29),
  ('The 300-Rep Gauntlet','Rue',5,'The intensity rating is not a joke.',52),
  ('Glute Forge Vol. 2','Hana',5,'Tempo hinges destroyed me in the best way.',16),
  ('Glute Forge Vol. 2','Theo',4,'Great programming, sore for two days.',40),
  ('Lunch-Break Ladder','Mira',4,'Squeezed it in between meetings. Refreshing.',22),
  ('Lunch-Break Ladder','Jon',3,'Good but a bit short for me.',58),
  ('Bench Press Meditation','Cass',5,'Heavy fives are meditative, turns out.',18),
  ('Bench Press Meditation','Liam',5,'Hit a PR following this. Thank you.',44),
  ('Rope Burn Intervals','Zoe',5,'Lungs: gone. Mood: incredible.',25),
  ('Rope Burn Intervals','Andre',4,'Thirty-on-thirty-off never gets easier.',61),
  ('Barefoot Balance Builder','Priya',5,'My ankles finally trust me again.',36),
  ('Stairwell Sprint Club','Felix',5,'Found a flight, regretted everything, came back.',31),
  ('Stairwell Sprint Club','Dana',4,'Simple and savage. Bring water.',66),
  ('Iron Hinge Masterclass','Rosa',5,'Worth the pro tag. Cueing is immaculate.',19),
  ('Iron Hinge Masterclass','Ben',5,'Posterior chain has never felt stronger.',55),
  ('Desk Detox Microflow','Ana',4,'Did it on a call with my camera off. Nobody knew.',27),
  ('Pull Day Cathedral','Wes',5,'Lats lit up. Rows for days.',34),
  ('Core Before Dawn','Suki',4,'Quiet, quick, effective. Abs sad.',41),
  ('Forest Walk + Flow','Noor',5,'Genuinely restorative. Did it in a park.',47),
  ('EMOM 16: Engine Check','Gus',5,'Sixteen minutes of honest feedback about my fitness.',23),
  ('EMOM 16: Engine Check','Lila',4,'The clock is ruthless. Loved it.',70),
  ('Sunday Long Lift','Omar',5,'Ninety minutes flew by. Bring the snacks, seriously.',38),
  ('Rainy Day Living-Room HIIT','Vera',4,'No gear needed and still smoked me.',45),
  ('Grip Strength Secrets','Ike',5,'Handshake game permanently upgraded.',50),
  ('Dance Cardio Fiesta','Coco',5,'Forgot I was exercising. Best kind of cardio.',28),
  ('Dance Cardio Fiesta','Milo',5,'Pure serotonin. Worth pro on its own.',72),
  ('Breath-First Conditioning','Sena',4,'Nasal-only was humbling. Recovery felt great after.',56),
  ('Park Bench Superset','Tariq',4,'One bench, full body. Efficient.',63),
  ('Posterior Chain Power Week','Elsa',5,'Day 3 nearly ended me. Following the whole week.',43),
  ('Leap Day Legs','Bruno',4,'Jump squats optional, regret mandatory. Accurate.',68),
  ('Minimalist Hotel Room WOD','Ada',5,'Travel saviour. Neighbours none the wiser.',75)
) AS r(title, author, rating, comment, hrs) ON w.title = r.title;

-- 6. Recalculate aggregates on workouts
UPDATE workouts w SET
  rating_sum = COALESCE(agg.s, 0),
  rating_count = COALESCE(agg.c, 0)
FROM (
  SELECT workout_id, SUM(rating) AS s, COUNT(*) AS c FROM reviews GROUP BY workout_id
) agg
WHERE w.id = agg.workout_id;

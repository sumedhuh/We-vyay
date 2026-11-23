-- Vibe profiles + community reviews for the seeded feed ok (idempotent)
DELETE FROM reviews;
UPDATE workouts SET rating_sum = 0, rating_count = 0;

-- Per-title vibe profiles (cardio / strength / mobility / intensity / endurance)
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

-- Community reviews
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

-- Roll the aggregates back onto the workouts
UPDATE workouts w SET
  rating_sum = COALESCE(agg.s, 0),
  rating_count = COALESCE(agg.c, 0)
FROM (
  SELECT workout_id, SUM(rating) AS s, COUNT(*) AS c FROM reviews GROUP BY workout_id
) agg
WHERE w.id = agg.workout_id;

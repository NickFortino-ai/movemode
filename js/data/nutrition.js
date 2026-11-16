/* ============================================================================
   nutrition.js — NUTRITION GUIDANCE PER GOAL
   ============================================================================
   Food guidance that matches whatever goal the user picked in onboarding.

   IMPORTANT GUARDRAILS — please keep these if you edit this file:
     - No extreme diets, no "cut out carbs", no detoxes, no fasting plans.
     - No specific low calorie targets. Any numbers are wide, rough ranges
       and are always labeled as rough.
     - Weight-loss guidance talks about ADDING habits (protein, veggies,
       water, walking), never about restricting or earning food.
     - Every goal shows MM.NUTRITION_DISCLAIMER somewhere on screen.

   This is a fitness site for all ages, including teenagers who are still
   growing. Under-eating is a much bigger risk than over-eating here.
   ========================================================================== */

// Shown at the bottom of every nutrition section, in both modes.
MM.NUTRITION_DISCLAIMER =
  'This is general info, not medical advice. If you are a teenager, still ' +
  'growing, or making a big change to how you eat or train, loop in a parent, ' +
  'coach, athletic trainer, or doctor first. Nobody here is tracking calories ' +
  'or telling you to eat less than your body needs.';

// Habits that apply to literally everyone, no matter the goal.
MM.NUTRITION_BASE_HABITS = [
  'Get some protein at every meal — eggs, milk, yogurt, chicken, beef, fish, beans, tofu, or a shake.',
  'Drink water through the day. A good check: your pee should be pale, not dark.',
  'Aim for fruits or vegetables at most meals. Frozen and canned count.',
  'Sleep 8–10 hours if you are a teen, 7–9 as an adult. Sleep is when your body actually adapts.',
  'Eat breakfast, even something small. Skipping it just means you are running on empty by 5th period.',
];

MM.NUTRITION = {
  /* ---------------------------------------------------------------------- */
  muscle: {
    headline: 'Eat enough to build',
    summary:
      'Muscle gets built from food plus training — you cannot grow on an empty tank. ' +
      'The most common mistake by far is simply not eating enough. Focus on regular ' +
      'meals with protein, and do not be afraid of carbs; they fuel your lifts.',
    roughRange:
      'Rough guide only: most people building muscle do well eating a bit more than ' +
      'usual — think an extra snack or two per day on top of three solid meals. ' +
      'There is no calorie target here on purpose.',
    priorities: [
      'Protein at every meal, plus a protein-containing snack after training.',
      'Carbs around your workouts — rice, pasta, bread, potatoes, fruit, oats.',
      'Three meals plus two or three snacks beats two big meals.',
      'If the scale and your lifts are both stuck for a few weeks, you probably need more food, not more sets.',
    ],
    meals: {
      Breakfast: [
        'Scrambled eggs with toast and a glass of milk',
        'Oatmeal with peanut butter, banana, and honey',
        'Greek yogurt with granola and berries',
        'Breakfast burrito with eggs, beans, and cheese',
      ],
      Lunch: [
        'Turkey and cheese sandwich, chips, apple, milk',
        'Chicken burrito bowl with rice, beans, and veggies',
        'Pasta with meat sauce and a side salad',
        'Two PB&Js and a yogurt when you are in a hurry',
      ],
      Dinner: [
        'Chicken thighs, rice, and broccoli',
        'Burgers with a baked potato and green beans',
        'Salmon or tilapia with pasta and veggies',
        'Stir fry with beef, rice, and whatever vegetables are around',
      ],
      Snacks: [
        'Protein shake with milk and a banana',
        'Trail mix and a string cheese',
        'Cottage cheese with pineapple',
        'Peanut butter on a bagel',
        'Chocolate milk after a hard session',
      ],
    },
    tips: [
      'Keep easy calories in your bag: trail mix, granola bars, a shaker bottle.',
      'Liquid calories are your friend when your appetite is low — milk, smoothies, juice.',
      'Weigh yourself once a week at the same time, not daily. Daily numbers are noise.',
    ],
  },

  /* ---------------------------------------------------------------------- */
  gain_weight: {
    headline: 'Fuel up for your sport',
    summary:
      'Putting on size for a sport means eating consistently and lifting hard. ' +
      'Your body needs a real surplus of food and sleep to add weight you can ' +
      'actually use on the field. Treat eating like part of your training.',
    roughRange:
      'Rough guide only: athletes gaining weight usually need noticeably more food ' +
      'than their friends — often three full meals plus three snacks. Rather than ' +
      'counting calories, make sure you never go more than about four waking hours ' +
      'without eating.',
    priorities: [
      'Never skip meals, especially on two-a-day or game days.',
      'Protein at every meal and a shake or chocolate milk right after practice.',
      'Carbs are non-negotiable for an athlete — they are what let you go hard in the 4th quarter.',
      'Add weight slowly. Gaining strength along with the weight is the whole point.',
    ],
    meals: {
      Breakfast: [
        'Four eggs, toast with butter, orange juice',
        'Big bowl of oatmeal with milk, peanut butter, and raisins',
        'Bagel sandwich with egg, cheese, and ham',
        'Smoothie: milk, yogurt, banana, oats, peanut butter',
      ],
      Lunch: [
        'Double meat sub with chips and milk',
        'Rice bowl with chicken, beans, cheese, and avocado',
        'Three slices of pizza plus a yogurt',
        'Leftovers from dinner, in a bigger portion than you think you need',
      ],
      Dinner: [
        'Steak or chicken, loaded baked potato, vegetables',
        'Spaghetti and meatballs with garlic bread',
        'Chicken quesadillas with rice and beans',
        'Pork chops, mac and cheese, and a vegetable',
      ],
      Snacks: [
        'Shake with milk, peanut butter, and a banana',
        'Chocolate milk after every practice',
        'Handful of nuts and dried fruit',
        'Bagel with cream cheese',
        'Yogurt and granola before bed',
      ],
    },
    tips: [
      'Pack a post-practice snack before you leave the house. The locker room is not the place to get hungry and have nothing.',
      'Hydrate hard around practice, especially in preseason heat.',
      'Talk to your coach or athletic trainer about a realistic target weight for your position.',
    ],
  },

  /* ---------------------------------------------------------------------- */
  lose_weight: {
    headline: 'Build habits, not restrictions',
    summary:
      'The approach here is adding good habits rather than cutting things out. ' +
      'Crash diets work for about three weeks and then fall apart. Daily movement, ' +
      'protein, vegetables, water, and sleep change things for good — and you will ' +
      'feel better the whole time instead of miserable.',
    roughRange:
      'There is no calorie target in this app, on purpose. Eating too little ' +
      'backfires: you lose muscle, your energy tanks, and you end up bingeing. ' +
      'Eat real meals until you are satisfied, and let daily activity do the work.',
    priorities: [
      'Move every day, even if it is just a 15 minute walk. Daily beats intense.',
      'Put protein and vegetables on your plate first, then everything else.',
      'Drink water instead of soda and sweet tea most of the time. This one is huge.',
      'Eat regular meals. Skipping lunch to "save up" almost always means overeating at night.',
      'No food is banned. Have the cake at the party — just not every day.',
    ],
    meals: {
      Breakfast: [
        'Eggs with fruit and toast',
        'Greek yogurt with berries',
        'Oatmeal with milk and cinnamon',
        'Smoothie with milk, frozen fruit, and spinach',
      ],
      Lunch: [
        'Turkey sandwich on whole grain with an apple',
        'Chicken salad or a burrito bowl loaded with veggies',
        'Soup with a side of bread and fruit',
        'Leftover dinner with extra vegetables added',
      ],
      Dinner: [
        'Grilled chicken, roasted potatoes, big pile of broccoli',
        'Tacos with lean meat, lots of lettuce and salsa',
        'Stir fry heavy on the vegetables with rice',
        'Pasta with marinara, chicken, and a salad',
      ],
      Snacks: [
        'Apple with peanut butter',
        'String cheese and a handful of almonds',
        'Carrots or peppers with hummus',
        'Yogurt cup',
        'Popcorn',
      ],
    },
    tips: [
      'Track the habit, not the weight. Days moved per week is a better scoreboard.',
      'The scale jumps around a few pounds from water and food. Look at the month, not the day.',
      'Sleep matters more than people expect — short sleep makes you hungrier the next day.',
    ],
  },

  /* ---------------------------------------------------------------------- */
  speed: {
    headline: 'Eat to perform',
    summary:
      'Speed and power work is high-effort and low-volume, and it demands fuel ' +
      'and recovery. You are training your nervous system — showing up tired, ' +
      'under-fed, or dehydrated wastes the session.',
    roughRange:
      'Rough guide only: performance athletes generally need more food on hard ' +
      'training days than on off days. Eat a carb-containing meal 2–3 hours before ' +
      'hard sprint or lift work. No calorie counting needed.',
    priorities: [
      'Carbs before hard sessions — they are the fuel for short, explosive efforts.',
      'Protein after, within an hour or so, to repair what you just worked.',
      'Hydrate before you are thirsty, especially for outdoor sprint work.',
      'Protect sleep. Reaction time and power output drop fast when you are short on it.',
    ],
    meals: {
      Breakfast: [
        'Oatmeal with banana and a side of eggs',
        'Bagel with peanut butter and juice',
        'Yogurt, granola, and fruit',
      ],
      Lunch: [
        'Chicken and rice bowl with vegetables',
        'Sandwich, fruit, pretzels, and milk',
        'Pasta with chicken and a salad',
      ],
      Dinner: [
        'Lean beef, sweet potato, and vegetables',
        'Chicken fajitas with rice and beans',
        'Fish with pasta and roasted vegetables',
      ],
      Snacks: [
        'Banana about an hour before training',
        'Chocolate milk right after',
        'Trail mix on the bus',
        'Pretzels and a sports drink on long tournament days',
      ],
    },
    tips: [
      'Do not try new foods on game day. Practice your pre-game meal during the week.',
      'A banana or granola bar 45 minutes out beats training on an empty stomach.',
      'If your sprints feel slow and heavy for days on end, you need food and sleep, not more sprints.',
    ],
  },

  /* ---------------------------------------------------------------------- */
  general: {
    headline: 'Simple, balanced fuel',
    summary:
      'For general fitness you do not need anything complicated. Regular meals, ' +
      'protein, plants, water, and sleep cover almost everything. Consistency with ' +
      'the basics beats any specific diet.',
    roughRange:
      'No calorie targets here. Eat three meals and a snack or two, built mostly ' +
      'from whole foods, and adjust based on how you feel and how your workouts go.',
    priorities: [
      'Three meals a day with protein in each.',
      'Something that grew out of the ground at most meals.',
      'Water as your default drink.',
      'Keep your favorite foods in the rotation — this should be sustainable.',
    ],
    meals: {
      Breakfast: [
        'Eggs and toast with fruit',
        'Overnight oats with yogurt and berries',
        'Smoothie with milk, fruit, and peanut butter',
      ],
      Lunch: [
        'Sandwich or wrap with fruit and milk',
        'Burrito bowl with chicken, rice, beans, veggies',
        'Big salad with a protein plus bread on the side',
      ],
      Dinner: [
        'Chicken, rice, and a vegetable',
        'Tacos with a side of beans',
        'Pasta with protein and a salad',
        'Breakfast for dinner: eggs, potatoes, fruit',
      ],
      Snacks: [
        'Fruit and nuts',
        'Yogurt',
        'Cheese and crackers',
        'Hummus and veggies',
      ],
    },
    tips: [
      'Cooking two or three meals you actually like beats searching for the perfect diet.',
      'Keep cut fruit and easy protein in the fridge so the easy choice is the good one.',
      'One off meal does not undo a good week. Just eat normally at the next one.',
    ],
  },

  /* ---------------------------------------------------------------------- */
  just_move: {
    headline: 'Food as fuel, nothing stressful',
    summary:
      'You are here to move more, and food does not need to be a project. ' +
      'Pick one or two habits below and let the rest be. That is genuinely enough ' +
      'to feel a difference.',
    roughRange:
      'No targets, no counting, no rules. Eat meals. Drink water. That is the plan.',
    priorities: [
      'Drink a glass of water when you wake up and refill through the day.',
      'Add a protein and a fruit or vegetable to whatever you already eat.',
      'Try not to skip meals — being starving by dinner makes everything harder.',
      'Walk a little after eating when you can. It feels good and helps digestion.',
    ],
    meals: {
      Breakfast: [
        'Yogurt and a banana',
        'Toast with peanut butter',
        'Eggs and fruit',
      ],
      Lunch: [
        'Sandwich and an apple',
        'Leftovers plus a vegetable',
        'Soup and bread',
      ],
      Dinner: [
        'Whatever your family is having, plus a vegetable',
        'Rotisserie chicken with rice and frozen veggies',
        'Pasta with sauce and a side salad',
      ],
      Snacks: [
        'Fruit',
        'Cheese stick',
        'Handful of nuts',
        'Crackers and hummus',
      ],
    },
    tips: [
      'One habit at a time. Water first is a great starting point.',
      'You do not need to eat perfectly to be healthier. Small upgrades count.',
      'Be kind to yourself about this stuff. Guilt has never made anyone healthier.',
    ],
  },
};

// Fall back to general guidance if a goal somehow has no entry.
MM.nutritionForGoal = function (goal) {
  return MM.NUTRITION[goal] || MM.NUTRITION.general;
};

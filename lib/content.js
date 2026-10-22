export const gameTypes = ["hiding","crowd","family","changes","final","playlist"];
export const themes = ["chanukah","everyday","birthday"];

// Shared game structure; themes can override any question pack.
const everyday = {
  "hiding": [
    {
      "image": "/assets/puzzles/scene-02.jpg",
      "prompt": "Whose workbench are we uncovering?",
      "options": [
        "A jeweller’s",
        "A bookbinder’s",
        "A toy maker’s",
        "A clockmaker’s"
      ],
      "correct": 3,
      "note": "Gears, pendulums, tools and clock mechanisms reveal a clockmaker’s workshop."
    },
    {
      "image": "/assets/puzzles/scene-03.jpg",
      "prompt": "Which place is growing into view?",
      "options": [
        "A greenhouse",
        "A fruit shop",
        "A country kitchen",
        "An outdoor orchard"
      ],
      "correct": 0,
      "note": "The glass roof, potted citrus trees, seed trays and gardening tools belong to a greenhouse."
    },
    {
      "image": "/assets/puzzles/scene-05.jpg",
      "prompt": "Where is this little journey beginning?",
      "options": [
        "A hotel lobby",
        "A railway station",
        "A luggage shop",
        "A library"
      ],
      "correct": 1,
      "note": "The ticket booth, platform, luggage trolley and steam train reveal a railway station."
    },
    {
      "image": "/assets/puzzles/scene-01.jpg",
      "prompt": "Where have we stepped inside?",
      "options": [
        "An artisan bakery",
        "A flower shop",
        "A pottery studio",
        "A market café"
      ],
      "correct": 0,
      "note": "The dough, trays of jam doughnuts, bread shelves and baking oven lead us to the bakery."
    },
    {
      "image": "/assets/puzzles/scene-04.jpg",
      "prompt": "Which craft brings this room to life?",
      "options": [
        "Wood carving",
        "Candle making",
        "Pottery",
        "Bread baking"
      ],
      "correct": 2,
      "note": "A freshly shaped clay jug sits on the potter’s wheel. The shelves and kiln complete the story."
    },
    {
      "image": "/assets/puzzles/scene-06.jpg",
      "prompt": "What is being made in this workshop?",
      "options": [
        "Soap",
        "Candles",
        "Cheese",
        "Paint"
      ],
      "correct": 1,
      "note": "Look for the hanging pairs of tapers, blocks of wax and spools of wick. It is a candle maker’s workshop."
    }
  ],
  "crowd": [
    {
      "prompt": "At a family gathering, what disappears first?",
      "options": [
        "The best snacks",
        "The comfy chairs",
        "The children",
        "The serving spoons"
      ]
    },
    {
      "prompt": "The whole family has a free afternoon. What wins?",
      "options": [
        "A picnic",
        "A board game",
        "A big meal",
        "A long nap"
      ]
    },
    {
      "prompt": "Who is most likely to say “one more round”?",
      "options": [
        "The children",
        "The grandparents",
        "The winning team",
        "The losing team"
      ]
    },
    {
      "prompt": "Your table gets one talent overnight. Which would the room pick?",
      "options": [
        "Cook anything perfectly",
        "Remember every name",
        "Always find lost things",
        "Play any instrument"
      ]
    },
    {
      "prompt": "What is the most satisfying little victory?",
      "options": [
        "Finding the missing sock",
        "Getting the last slice",
        "Guessing a surprise",
        "Arriving exactly on time"
      ]
    },
    {
      "prompt": "A family time capsule can hold just one thing. What goes in?",
      "options": [
        "A family photograph",
        "A favourite recipe",
        "Everyone’s handwriting",
        "A recording of our voices"
      ]
    }
  ],
  "family": [
    {
      "prompt": "Sample story: Grandpa hid the afikoman inside a cookbook. Who accidentally found it while looking for a cake recipe?",
      "options": [
        "The person baking",
        "The person setting the table",
        "The person at the door",
        "The person washing dishes"
      ],
      "correct": 0,
      "note": "A fictional warm-up: the baker found it. Replace these samples with your own family stories in game setup."
    },
    {
      "prompt": "Sample story: Rivky took a photograph, Yossi packed the bags, and Grandpa drove. Who could be missing from the photograph?",
      "options": [
        "Grandpa",
        "Yossi",
        "Rivky",
        "Nobody"
      ],
      "correct": 2,
      "note": "Rivky was behind the camera. A fictional warm-up—your own family facts make this game personal."
    },
    {
      "prompt": "Sample story: The family recipe says “ask Bubby how much”. Who is keeping the secret ingredient alive?",
      "options": [
        "The printer",
        "Bubby",
        "The neighbour",
        "The delivery driver"
      ],
      "correct": 1,
      "note": "Bubby knows! Add the real story and its answer in Family Detectives setup."
    }
  ],
  "changes": [
    {
      "prompt": "A quiet room. A lot to remember.",
      "before": "/assets/puzzles/memory-01-a.jpg",
      "after": "/assets/puzzles/memory-01-b.jpg",
      "objects": [
        "Cushion",
        "Top book",
        "Wall picture",
        "Teapot",
        "Cups",
        "Balloon",
        "Clock",
        "Plant",
        "Window"
      ],
      "changes": [
        "Cushion",
        "Top book",
        "Wall picture"
      ],
      "note": "The cushion disappeared, the top book turned blue, and the sailboat picture became a mountain scene."
    },
    {
      "prompt": "A morning at the little market.",
      "before": "/assets/puzzles/memory-02-a.jpg",
      "after": "/assets/puzzles/memory-02-b.jpg",
      "objects": [
        "Apples",
        "Bananas",
        "Cat",
        "Scales",
        "Cheese",
        "Bottles",
        "Clock",
        "Saucepan",
        "Flowers"
      ],
      "changes": [
        "Apples",
        "Bananas",
        "Cat"
      ],
      "note": "The apples turned green, the bananas disappeared, and the sleeping cat left its spot."
    },
    {
      "prompt": "An explorer’s desk. Notice the details.",
      "before": "/assets/puzzles/memory-03-a.jpg",
      "after": "/assets/puzzles/memory-03-b.jpg",
      "objects": [
        "Lamp",
        "Mug",
        "Notebook",
        "Globe",
        "Binoculars",
        "Suitcase",
        "Clock",
        "Model ship",
        "Plant"
      ],
      "changes": [
        "Lamp",
        "Mug",
        "Notebook"
      ],
      "note": "The lamp shade turned blue, the mug disappeared, and the closed notebook opened."
    }
  ],
  "final": [
    {
      "prompt": "Which shape has eight sides?",
      "options": [
        "Hexagon",
        "Octagon",
        "Pentagon",
        "Heptagon"
      ],
      "correct": 1,
      "note": "An octagon has eight sides.",
      "hard": {
        "prompt": "How many diagonals does an octagon have?",
        "options": [
          "16",
          "20",
          "24",
          "28"
        ],
        "correct": 1,
        "note": "Eight vertices × five non-neighbours ÷ two = 20."
      }
    },
    {
      "prompt": "Which of these is a mammal?",
      "options": [
        "Dolphin",
        "Shark",
        "Octopus",
        "Penguin"
      ],
      "correct": 0,
      "note": "Dolphins breathe air and feed their young milk.",
      "hard": {
        "prompt": "Which mammal lays eggs?",
        "options": [
          "Otter",
          "Beaver",
          "Platypus",
          "Seal"
        ],
        "correct": 2,
        "note": "The platypus is an egg-laying mammal."
      }
    },
    {
      "prompt": "How many minutes are in a quarter of an hour?",
      "options": [
        "10",
        "12",
        "15",
        "25"
      ],
      "correct": 2,
      "note": "One quarter of 60 minutes is 15.",
      "hard": {
        "prompt": "A clock gains two minutes every hour. How much does it gain in a day?",
        "options": [
          "24 minutes",
          "36 minutes",
          "48 minutes",
          "60 minutes"
        ],
        "correct": 2,
        "note": "Two minutes × 24 hours = 48 minutes."
      }
    },
    {
      "prompt": "You overtake the person in second place in a race. What place are you in?",
      "options": [
        "First",
        "Second",
        "Third",
        "It depends on the speed"
      ],
      "correct": 1,
      "note": "You take their place: second. The leader is still ahead.",
      "hard": {
        "prompt": "Three boxes hold 2, 4 and 6 candles. Move one candle from the fullest box to the emptiest. What is the new largest count?",
        "options": [
          "Three",
          "Four",
          "Five",
          "Six"
        ],
        "correct": 2,
        "note": "The counts become 3, 4 and 5. The largest is five."
      }
    },
    {
      "prompt": "Which weighs more: a kilogram of feathers or a kilogram of potatoes?",
      "options": [
        "The feathers",
        "The potatoes",
        "They weigh the same",
        "It depends on the bag"
      ],
      "correct": 2,
      "note": "A kilogram is a kilogram, however much space it takes up.",
      "hard": {
        "prompt": "A ribbon is 120 cm long. You cut off one quarter, then half of what remains. How much is left?",
        "options": [
          "30 cm",
          "40 cm",
          "45 cm",
          "60 cm"
        ],
        "correct": 2,
        "note": "A quarter is 30 cm. From the remaining 90 cm, half leaves 45 cm."
      }
    },
    {
      "prompt": "What comes next: 2, 4, 8, 16, …?",
      "options": [
        "18",
        "24",
        "30",
        "32"
      ],
      "correct": 3,
      "note": "Double the previous number: 16 × 2 = 32.",
      "hard": {
        "prompt": "A square table seats one person on each side. Put three tables in a straight row, with touching sides unavailable. How many can sit?",
        "options": [
          "Six",
          "Eight",
          "Ten",
          "Twelve"
        ],
        "correct": 1,
        "note": "Twelve sides minus four touching sides leaves eight seats."
      }
    }
  ]
};

const chanukah = {
  "hiding": [
    {
      "image": "/assets/puzzles/scene-01.jpg",
      "prompt": "Where have we stepped inside?",
      "options": [
        "An artisan bakery",
        "A flower shop",
        "A pottery studio",
        "A market café"
      ],
      "correct": 0,
      "note": "The dough, trays of jam doughnuts, bread shelves and baking oven lead us to the bakery."
    },
    {
      "image": "/assets/puzzles/scene-04.jpg",
      "prompt": "Which craft brings this room to life?",
      "options": [
        "Wood carving",
        "Candle making",
        "Pottery",
        "Bread baking"
      ],
      "correct": 2,
      "note": "A freshly shaped clay jug sits on the potter’s wheel. The shelves and kiln complete the story."
    },
    {
      "image": "/assets/puzzles/scene-06.jpg",
      "prompt": "What is being made in this workshop?",
      "options": [
        "Soap",
        "Candles",
        "Cheese",
        "Paint"
      ],
      "correct": 1,
      "note": "Look for the hanging pairs of tapers, blocks of wax and spools of wick. It is a candle maker’s workshop."
    },
    {
      "image": "/assets/puzzles/scene-02.jpg",
      "prompt": "Whose workbench are we uncovering?",
      "options": [
        "A jeweller’s",
        "A bookbinder’s",
        "A toy maker’s",
        "A clockmaker’s"
      ],
      "correct": 3,
      "note": "Gears, pendulums, tools and clock mechanisms reveal a clockmaker’s workshop."
    },
    {
      "image": "/assets/puzzles/scene-03.jpg",
      "prompt": "Which place is growing into view?",
      "options": [
        "A greenhouse",
        "A fruit shop",
        "A country kitchen",
        "An outdoor orchard"
      ],
      "correct": 0,
      "note": "The glass roof, potted citrus trees, seed trays and gardening tools belong to a greenhouse."
    },
    {
      "image": "/assets/puzzles/scene-05.jpg",
      "prompt": "Where is this little journey beginning?",
      "options": [
        "A hotel lobby",
        "A railway station",
        "A luggage shop",
        "A library"
      ],
      "correct": 1,
      "note": "The ticket booth, platform, luggage trolley and steam train reveal a railway station."
    }
  ],
  "crowd": [
    {
      "prompt": "Which Chanukah treat would this room choose?",
      "options": [
        "Crispy latkes",
        "Jam doughnuts",
        "Chocolate gelt",
        "A little of everything"
      ]
    },
    {
      "prompt": "What makes the best Chanukah evening?",
      "options": [
        "The singing",
        "The food",
        "The games",
        "Everyone together"
      ]
    },
    {
      "prompt": "What is the best latke topping?",
      "options": [
        "Apple sauce",
        "Sour cream",
        "Nothing at all",
        "More latkes"
      ]
    },
    {
      "prompt": "The last doughnut is on the plate. What happens next?",
      "options": [
        "Someone cuts it in half",
        "The youngest gets it",
        "Everyone says “you take it”",
        "It quietly disappears"
      ]
    },
    {
      "prompt": "What would this room choose for a surprise Chanukah gift?",
      "options": [
        "A favourite book",
        "A family day out",
        "A beautiful game",
        "Something homemade"
      ]
    },
    {
      "prompt": "What will everyone remember about tonight?",
      "options": [
        "The winning team",
        "The funniest answer",
        "The delicious food",
        "Being together"
      ]
    }
  ],
  "final": [
    {
      "prompt": "On the sixth night, two families each light six Chanukah lights. How many lights altogether, excluding shamashim?",
      "options": [
        "Six",
        "Eight",
        "Twelve",
        "Fourteen"
      ],
      "correct": 2,
      "note": "Six lights at each home: 6 + 6 = 12, excluding the shamashim.",
      "hard": {
        "prompt": "How many lights are lit over all eight nights, excluding the shamash?",
        "options": [
          "32",
          "36",
          "40",
          "44"
        ],
        "correct": 1,
        "note": "1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 = 36."
      }
    },
    {
      "prompt": "There are 18 doughnuts and 6 tables. Shared equally, how many does each table get?",
      "options": [
        "Two",
        "Three",
        "Four",
        "Six"
      ],
      "correct": 1,
      "note": "18 divided by 6 gives three doughnuts per table.",
      "hard": {
        "prompt": "A box holds 6 doughnuts. You need at least 44 doughnuts. How many full boxes must you buy?",
        "options": [
          "Six",
          "Seven",
          "Eight",
          "Nine"
        ],
        "correct": 2,
        "note": "Seven boxes give only 42. Eight boxes give 48."
      }
    },
    {
      "prompt": "The first game starts at 7:15 and lasts 35 minutes. When does it finish?",
      "options": [
        "7:40",
        "7:50",
        "7:55",
        "8:00"
      ],
      "correct": 1,
      "note": "15 + 35 = 50 minutes past seven.",
      "hard": {
        "prompt": "Four rounds take 7 minutes each, with a 2-minute break between rounds. How long does the session take?",
        "options": [
          "30 minutes",
          "32 minutes",
          "34 minutes",
          "36 minutes"
        ],
        "correct": 2,
        "note": "Four rounds make 28 minutes. There are three breaks, adding 6: total 34."
      }
    },
    {
      "prompt": "You overtake the person in second place in a race. What place are you in?",
      "options": [
        "First",
        "Second",
        "Third",
        "It depends on the speed"
      ],
      "correct": 1,
      "note": "You take their place: second. The leader is still ahead.",
      "hard": {
        "prompt": "Three boxes hold 2, 4 and 6 candles. Move one candle from the fullest box to the emptiest. What is the new largest count?",
        "options": [
          "Three",
          "Four",
          "Five",
          "Six"
        ],
        "correct": 2,
        "note": "The counts become 3, 4 and 5. The largest is five."
      }
    },
    {
      "prompt": "Which weighs more: a kilogram of feathers or a kilogram of potatoes?",
      "options": [
        "The feathers",
        "The potatoes",
        "They weigh the same",
        "It depends on the bag"
      ],
      "correct": 2,
      "note": "A kilogram is a kilogram, however much space it takes up.",
      "hard": {
        "prompt": "A ribbon is 120 cm long. You cut off one quarter, then half of what remains. How much is left?",
        "options": [
          "30 cm",
          "40 cm",
          "45 cm",
          "60 cm"
        ],
        "correct": 2,
        "note": "A quarter is 30 cm. From the remaining 90 cm, half leaves 45 cm."
      }
    },
    {
      "prompt": "What comes next: 2, 4, 8, 16, …?",
      "options": [
        "18",
        "24",
        "30",
        "32"
      ],
      "correct": 3,
      "note": "Double the previous number: 16 × 2 = 32.",
      "hard": {
        "prompt": "A square table seats one person on each side. Put three tables in a straight row, with touching sides unavailable. How many can sit?",
        "options": [
          "Six",
          "Eight",
          "Ten",
          "Twelve"
        ],
        "correct": 1,
        "note": "Twelve sides minus four touching sides leaves eight seats."
      }
    }
  ]
};

export function getQuestions(game, theme, custom = [], hiding = []) {
  if (game === 'playlist') return gameTypes.filter(g => g !== 'playlist').flatMap(g => getQuestions(g, theme, custom, hiding).slice(0, g === 'hiding' && hiding.length ? hiding.length : g === 'family' && custom.length ? custom.length : 3).map(q => ({ ...q, kind: g })));
  if (game === 'hiding' && hiding.length) return hiding.map(q => ({ prompt: q.prompt.trim(), image: q.image, options: q.options.map(o => o.trim()), correct: q.correct, note: q.note || 'A picture from your own collection.' }));
  if (game === 'family' && custom.length) return custom.map(q => ({ ...q, note: q.note || 'A story only your family could tell.' }));
  const source = theme === 'chanukah' && chanukah[game] ? chanukah[game] : everyday[game];
  return structuredClone(source);
}

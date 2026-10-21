export const gameTypes = ['hiding', 'crowd', 'family', 'changes', 'final', 'playlist'];
export const themes = ['chanukah', 'everyday', 'birthday'];

const everyday = {
  hiding: [
    { title: 'A little mystery. A big reveal.', prompt: 'What is hiding behind the tiles?', object: 'bicycle', options: ['Bicycle', 'Wheelbarrow', 'Scooter', 'Shopping trolley'], correct: 0, note: 'Two wheels, endless adventures. A bicycle!' },
    { title: 'Look a little closer…', prompt: 'Can your table name the mystery object?', object: 'teapot', options: ['Watering can', 'Teapot', 'Lamp', 'Kettle bell'], correct: 1, note: 'Put the kettle on. It is a teapot!' },
    { title: 'One last little mystery.', prompt: 'What is making its grand entrance?', object: 'umbrella', options: ['Mushroom', 'Parachute', 'Umbrella', 'Jellyfish'], correct: 2, note: 'A very colourful way to stay dry.' }
  ],
  crowd: [
    { prompt: 'At a family gathering, what disappears first?', options: ['The best snacks', 'The comfy chairs', 'The children', 'The serving spoons'] },
    { prompt: 'The whole family has a free afternoon. What wins?', options: ['A picnic', 'A board game', 'A big meal', 'A long nap'] },
    { prompt: 'Who is most likely to say “one more round”?', options: ['The children', 'The grandparents', 'The winning team', 'The losing team'] }
  ],
  family: [
    { prompt: 'Who taught the family their favourite recipe?', options: ['A grandparent', 'A parent', 'A sibling', 'A family friend'], correct: 0, note: 'This is a sample story. Add your own family questions before hosting.' },
    { prompt: 'Where did our most memorable family trip take us?', options: ['The seaside', 'The mountains', 'The countryside', 'Another city'], correct: 1, note: 'A sample question to show how Family Detectives works.' },
    { prompt: 'Who is the family’s unofficial photographer?', options: ['Grandpa', 'Mum', 'An aunt', 'A cousin'], correct: 3, note: 'Replace this sample with a real family fact in the setup.' }
  ],
  changes: [
    { prompt: 'Study the party table. Three things will change.', changes: ['balloon', 'gift', 'cup'], note: 'The balloon, gift ribbon and cup changed colour.' },
    { prompt: 'Look carefully. Can you remember every detail?', changes: ['cake', 'plant', 'balloon'], note: 'The cake, plant pot and balloon changed colour.' },
    { prompt: 'One more look at our party table.', changes: ['cup', 'cake', 'gift'], note: 'The cup, cake and gift ribbon changed colour.' }
  ],
  final: [
    { prompt: 'Which shape has eight sides?', options: ['Hexagon', 'Octagon', 'Pentagon', 'Heptagon'], correct: 1, note: 'An octagon has eight sides.', hard: { prompt: 'How many diagonals does an octagon have?', options: ['16', '20', '24', '28'], correct: 1, note: 'Eight vertices × five non-neighbours ÷ two = 20.' } },
    { prompt: 'Which of these is a mammal?', options: ['Dolphin', 'Shark', 'Octopus', 'Penguin'], correct: 0, note: 'Dolphins breathe air and feed their young milk.', hard: { prompt: 'Which mammal lays eggs?', options: ['Otter', 'Beaver', 'Platypus', 'Seal'], correct: 2, note: 'The platypus is an egg-laying mammal.' } },
    { prompt: 'How many minutes are in a quarter of an hour?', options: ['10', '12', '15', '25'], correct: 2, note: 'One quarter of 60 minutes is 15.', hard: { prompt: 'A clock gains two minutes every hour. How much does it gain in a day?', options: ['24 minutes', '36 minutes', '48 minutes', '60 minutes'], correct: 2, note: 'Two minutes × 24 hours = 48 minutes.' } }
  ]
};
const chanukah = {
  hiding: [
    { prompt: 'What Chanukah treasure is hiding behind the tiles?', object: 'dreidel', options: ['Dreidel', 'Oil jug', 'Gift box', 'Candlestick'], correct: 0, note: 'Give it a spin! It is a dreidel.' },
    { prompt: 'A sweet mystery is about to appear…', object: 'doughnut', options: ['Challah', 'Doughnut', 'Latke', 'Bagel'], correct: 1, note: 'A doughnut with a little jam in the middle.' },
    { prompt: 'What is our final hidden treasure?', object: 'jug', options: ['Vase', 'Teapot', 'Oil jug', 'Goblet'], correct: 2, note: 'A little oil jug, ready for a bright celebration.' }
  ],
  crowd: [
    { prompt: 'Which Chanukah treat would this room choose?', options: ['Crispy latkes', 'Jam doughnuts', 'Chocolate gelt', 'A little of everything'] },
    { prompt: 'What makes the best Chanukah evening?', options: ['The singing', 'The food', 'The games', 'Everyone together'] },
    { prompt: 'What is the best latke topping?', options: ['Apple sauce', 'Sour cream', 'Nothing at all', 'More latkes'] }
  ],
  final: [
    { prompt: 'How many nights do we celebrate Chanukah?', options: ['Six', 'Seven', 'Eight', 'Nine'], correct: 2, note: 'Eight nights of Chanukah.', hard: { prompt: 'How many lights are lit over all eight nights, excluding the shamash?', options: ['32', '36', '40', '44'], correct: 1, note: '1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 = 36.' } },
    { prompt: 'Which item do we spin on Chanukah?', options: ['A dreidel', 'An oil jug', 'A latke', 'A candle'], correct: 0, note: 'A dreidel!', hard: { prompt: 'Which Hebrew letter commonly appears on an Israeli dreidel instead of shin?', options: ['Aleph', 'Bet', 'Pe', 'Tav'], correct: 2, note: 'Pe stands for “po” — here.' } },
    { prompt: 'Which food is traditionally fried in oil?', options: ['Fruit salad', 'Latkes', 'Grape juice', 'Challah'], correct: 1, note: 'Crispy, golden latkes.', hard: { prompt: 'On which date in Kislev does Chanukah begin?', options: ['15', '20', '25', '30'], correct: 2, note: 'Chanukah begins on the 25th of Kislev.' } }
  ]
};

export function getQuestions(game, theme, custom = []) {
  if (game === 'playlist') return gameTypes.filter(g => g !== 'playlist').flatMap(g => getQuestions(g, theme, custom).map(q => ({ ...q, kind: g })));
  if (game === 'family' && custom.length) return custom.map(q => ({ ...q, note: q.note || 'A story only your family could tell.' }));
  const source = theme === 'chanukah' && chanukah[game] ? chanukah[game] : everyday[game];
  return structuredClone(source);
}

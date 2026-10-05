export type PuzzleCategory = "Logic" | "Math" | "Arrangement"|"Shape based"|"Strategy" | "Other";
export type PuzzleDifficulty = "Easy" | "Medium" | "Hard";

export type PuzzleSolutionStep = {
  title?: string;
  content: string;
  code?: string;
};

export type Puzzle = {
  id: string;
  title: string;
  category: PuzzleCategory;
  difficulty: PuzzleDifficulty;
  question: string;
  conditions?: string[];
};

export type PuzzleVisual = { uri: string; width: number; height: number; caption: string; description: string };
export type PuzzleAnswer = { answer: string; solution: PuzzleSolutionStep[]; keyIdea?: string; visual?: PuzzleVisual; visualNotice?: string };

export const puzzles: Puzzle[] = [
  {
    "id": "burning-candles",
    "title": "The Burning Candles",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have two candles that can be lit from either end. Each candle takes exactly 60 minutes to burn completely when lit from one end, but each burns unevenly along its length. Using only these candles and matches, how can you measure exactly 45 minutes and also identify a 15-minute interval?",
    "conditions": [
      "Each candle takes exactly 60 minutes to burn from one end.",
      "The candles do not burn at a uniform rate along their length.",
      "Either end of a candle may be lit."
    ]
  },
  {
    "id": "25-horses-top-3",
    "title": "25 Horses — Find the Top 3",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "You have 25 horses and can race only 5 horses at a time. You have no stopwatch, so each race tells you only the finishing order. What is the minimum number of races needed to determine the three fastest horses?",
    "conditions": [
      "Only 5 horses can race at once.",
      "There is no stopwatch.",
      "Assume each horse's relative speed is consistent."
    ]
  },
  {
    "id": "torch-and-bridge",
    "title": "Torch and Bridge",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "Four people A, B, C and D must cross a bridge at night. Their crossing times are 1, 2, 5 and 8 minutes respectively. They have one torch, at most two people can cross at once, and anyone crossing must carry the torch. When two people cross together, they move at the slower person's pace. Can everyone cross in 15 minutes?",
    "conditions": [
      "A takes 1 minute.",
      "B takes 2 minutes.",
      "C takes 5 minutes.",
      "D takes 8 minutes.",
      "At most two people may be on the bridge.",
      "The torch must accompany every crossing."
    ]
  },
  {
    "id": "poison-and-rats",
    "title": "Poison and Rat",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "There are 1000 wine bottles and exactly one is poisoned. A rat that drinks poisoned wine dies within one hour. Each rat may drink samples from any number of bottles once at the start. What is the minimum number of rats needed to identify the poisoned bottle in one hour?",
    "conditions": [
      "Exactly one bottle is poisoned.",
      "A poisoned sample kills a rat within one hour.",
      "Each rat can sample any number of bottles at the start.",
      "You get only one round of testing."
    ]
  },
  {
    "id": "two-eggs-100-floors",
    "title": "Two Eggs & 100 Floors",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "You have two identical eggs and a 100-floor building. There is a critical floor such that an egg survives when dropped from that floor or any floor below it, but breaks from any floor above it. Determine the highest safe floor while minimizing the maximum number of drops required in the worst case.",
    "conditions": [
      "You have only two eggs.",
      "A broken egg cannot be reused.",
      "An unbroken egg can be reused.",
      "All eggs behave identically.",
      "If an egg breaks at a floor, it will break from every higher floor.",
      "If an egg survives at a floor, it will survive every lower floor."
    ]
  },
  {
    "id": "water-jug-problem",
    "title": "Water Jug Problem",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have an unmarked 4-gallon jug and an unmarked 9-gallon jug, with an unlimited water supply. You may fill, empty, or pour between them. Can you measure every whole-gallon amount from 1G through 9G?",
    "conditions": [
      "The jugs hold exactly 4 gallons and 9 gallons.",
      "Neither jug has measurement markings.",
      "The water supply is unlimited.",
      "You may fill, empty, and transfer water between the jugs."
    ]
  },
  {
    "id": "legs-in-palace",
    "title": "Number of Legs in the Palace",
    "category": "Math",
    "difficulty": "Easy",
    "question": "You are standing inside a palace with 5 guards. Each guard watches 5 rooms. Every room contains 5 adult tigers, and every adult tiger has 5 cubs. How many legs are inside the palace altogether?"
  },
  {
    "id": "six-houses",
    "title": "Six Houses — P, Q, R, S, T & U",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "Six houses P, Q, R, S, T and U are arranged with three houses on each side of a road. Their colors and heights are all different. T is the tallest and is opposite the Red house. The shortest house is opposite the Green house. U is Orange and lies between P and S. R is Yellow and opposite P. Q is Green and opposite U. P is White, taller than R, but shorter than S and Q. What color is the tallest house, and how many houses are taller than R?"
  },
  {
    "id": "eight-balls",
    "title": "8 Balls Problem",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have 8 visually identical balls. Seven have equal weight and one defective ball is lighter. Using a balance scale only twice, can you always identify the defective ball?",
    "conditions": [
      "Exactly one ball is lighter.",
      "The other seven balls have identical weight.",
      "Only two weighings are allowed."
    ]
  },
  {
    "id": "100-prisoners-hats",
    "title": "100 Prisoners with Red/Black Hats",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "100 prisoners stand in a line facing forward. Each wears either a red or black hat and can see every hat in front, but not their own or hats behind. Starting from the back, each must say only 'red' or 'black'. Everyone hears previous answers. What strategy maximizes the guaranteed number of survivors?",
    "conditions": [
      "Each prisoner sees all hats in front.",
      "Everyone hears all previous answers.",
      "Only red or black may be spoken.",
      "They may agree on a strategy beforehand."
    ]
  },
  {
    "id": "daughters-ages",
    "title": "Find the Ages of the Daughters",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Alok has three daughters. The product of their ages is 72. The sum of their ages is equal to his house number. Shyam knows the house number but still cannot determine their ages. Alok then says, 'My oldest daughter likes strawberry ice cream.' What are the ages of the three daughters?",
    "conditions": [
      "The daughters' ages are positive whole numbers.",
      "The product of their ages is 72.",
      "Their age sum equals the house number.",
      "After seeing the house number, Shyam still cannot determine the ages.",
      "There is a unique oldest daughter."
    ]
  },
  {
    "id": "bee-between-trains",
    "title": "Total Distance Travelled by the Bee",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Two trains are 100 km apart and moving toward each other at 50 km/h and 70 km/h. A bee flies continuously between them at 80 km/h until the trains collide. How far does the bee travel?",
    "conditions": [
      "Train A travels at 50 km/h.",
      "Train B travels at 70 km/h.",
      "The trains initially are 100 km apart.",
      "The bee travels at a constant 80 km/h.",
      "The bee flies continuously until the trains collide."
    ]
  },
  {
    "id": "six-by-six-grid-paths",
    "title": "Ways to Reach Bottom Right in a 6×6 Grid",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Starting from the top-left cell of a 6×6 grid, you may move only right or down. How many different paths are there to reach the bottom-right cell?",
    "conditions": [
      "The grid contains 6 rows and 6 columns of cells.",
      "Start at the top-left cell.",
      "Finish at the bottom-right cell.",
      "Only right and down moves are allowed.",
      "Diagonal and backward moves are not allowed."
    ]
  },
  {
    "id": "monty-hall",
    "title": "Monty Hall Problem",
    "category": "Math",
    "difficulty": "Medium",
    "question": "There are three doors: one hides a car and two hide goats. You choose one door. The host, who knows what is behind every door, opens another door that always contains a goat and then offers you the chance to switch to the remaining unopened door. Should you stay or switch to maximize your chance of winning the car?",
    "conditions": [
      "Exactly one door contains a car.",
      "The other two doors contain goats.",
      "The host knows where the car is.",
      "The host never opens your chosen door.",
      "The host always opens a door containing a goat.",
      "The host always offers you the chance to switch."
    ]
  },
  {
    "id": "maximize-white-ball-probability",
    "title": "Maximize the Probability of Drawing a White Ball",
    "category": "Math",
    "difficulty": "Medium",
    "question": "You have two empty jars and 100 balls: 50 white and 50 black. You may distribute all the balls between the jars however you like. One jar is then selected uniformly at random, followed by one random ball from that jar. How should you distribute the balls to maximize the probability of drawing a white ball?",
    "conditions": [
      "There are exactly 50 white and 50 black balls.",
      "All 100 balls must be distributed between the two jars.",
      "Each jar has an equal 1/2 chance of being selected.",
      "A ball is selected uniformly at random from the chosen jar."
    ]
  },
  {
    "id": "four-seven-hourglasses",
    "title": "Measure 9 Minutes with Two Hourglasses",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have a 4-minute hourglass and a 7-minute hourglass. How can you measure exactly 9 minutes?",
    "conditions": [
      "The hourglasses measure exactly 4 and 7 minutes.",
      "You may flip either hourglass whenever necessary.",
      "Both hourglasses may run simultaneously."
    ]
  },
  {
    "id": "boy-preference-ratio",
    "title": "The Boy Preference Ratio Riddle",
    "category": "Math",
    "difficulty": "Medium",
    "question": "In a country, every family continues having children until they have a boy, after which they stop. Assuming every birth independently has a 50% chance of being a boy or a girl, what is the expected ratio of boys to girls in the population?",
    "conditions": [
      "Each birth independently has a 50% chance of being a boy.",
      "Each birth independently has a 50% chance of being a girl.",
      "Every family stops having children immediately after its first boy."
    ]
  },
  {
    "id": "car-wheel-puzzle",
    "title": "Car Wheel Puzzle",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A car has 4 tires in use and 1 spare tire. Each tire can last for at most 20,000 km. You may rotate the tires with the spare as often as needed. What is the maximum distance the car can travel before a new tire is required?",
    "conditions": [
      "There are 5 tires in total.",
      "Exactly 4 tires are required while driving.",
      "Each tire can be used for at most 20,000 km.",
      "The spare may be swapped with any tire as often as necessary."
    ]
  },
  {
    "id": "maximum-chocolates",
    "title": "Maximum Chocolates",
    "category": "Math",
    "difficulty": "Easy",
    "question": "You have ₹15. Each chocolate costs ₹1, and the shopkeeper exchanges 3 empty chocolate wrappers for 1 new chocolate. What is the maximum number of chocolates you can eat?",
    "conditions": [
      "Each chocolate costs ₹1.",
      "You initially have ₹15.",
      "Three wrappers can be exchanged for one chocolate.",
      "Every additional chocolate eaten also produces a new wrapper."
    ]
  },
  {
    "id": "cake-missing-piece",
    "title": "Split a Cake with a Missing Piece",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A rectangular piece of arbitrary size and rotation has been removed from a rectangular cake. Using only one straight vertical cut, how can the remaining cake be divided into two portions of equal area?",
    "conditions": [
      "The original cake is rectangular.",
      "The removed piece is also rectangular.",
      "The missing rectangle may have arbitrary size, position, and rotation.",
      "Only one straight vertical cut may be made.",
      "The cut is allowed to pass through the missing region."
    ]
  },
  {
    "id": "fake-note-puzzle",
    "title": "The Fake Note Puzzle",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A customer buys ₹200 worth of goods using a fake ₹1,000 note. The shopkeeper gets ₹1,000 of real change from a neighboring shop, gives the customer ₹800 change, and keeps ₹200. Later the neighbor discovers the note is fake, so the shopkeeper returns ₹1,000 of real money. Assuming the goods are sold at no profit, what is the shopkeeper's total loss?",
    "conditions": [
      "The ₹1,000 note given by the customer is worthless.",
      "The goods are worth ₹200 to the shopkeeper.",
      "The customer receives ₹800 in real cash as change.",
      "The shopkeeper fully reimburses the neighboring shop."
    ]
  },
  {
    "id": "tuesday-boy-paradox",
    "title": "Tuesday Boy Paradox",
    "category": "Math",
    "difficulty": "Hard",
    "question": "A family has two children. You know that at least one of them is a boy born on a Tuesday. Assuming each child's sex is independently equally likely and each day of birth is independently equally likely, what is the probability that both children are boys?",
    "conditions": [
      "The family has exactly two children.",
      "Each child independently has a 50% chance of being a boy or girl.",
      "Each child is independently equally likely to be born on any of the seven days.",
      "The given information is specifically that at least one child is a boy born on Tuesday."
    ]
  },
  {
    "id": "private-average-salary",
    "title": "Know the Average Salary Without Disclosing Salaries",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Three employees want to calculate their average salary without directly revealing their individual salaries to one another. How can they calculate the average using private random numbers?",
    "conditions": [
      "There are three employees: X, Y, and Z.",
      "Each employee keeps their salary private.",
      "Each employee may privately choose a random number.",
      "They may pass running totals to one another.",
      "The protocol is intended as a puzzle technique, not as a cryptographically secure privacy protocol."
    ]
  },
  {
    "id": "maximum-runs-cricket",
    "title": "Maximum Runs in an ODI",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "In a 50-over ODI with 300 legal deliveries, assume there are no extras or overthrows. A batsman can hit boundaries normally, but when running between the wickets, a maximum of 3 runs can be taken from a ball. What is the maximum number of runs one batsman can score while retaining strike across the overs?",
    "conditions": [
      "The innings consists of exactly 50 overs or 300 legal deliveries.",
      "There are no wides, no-balls, extras, or overthrows.",
      "A six scores 6 runs.",
      "A maximum of 3 runs may be completed by running on a delivery.",
      "The batsman must strategically retain strike for the next over."
    ]
  },
  {
    "id": "completion-of-task",
    "title": "Completion of Task",
    "category": "Math",
    "difficulty": "Medium",
    "question": "A man doubles the amount of work he does each day and completes the entire task in 18 days. Approximately by the end of which day has he completed 25% of the total work?",
    "conditions": [
      "The amount of work performed each day is twice the previous day's amount.",
      "The entire task is completed by the end of Day 18.",
      "The requested 25% point is interpreted approximately at the end of a whole day."
    ]
  },
  {
    "id": "missing-number-one-to-fifty",
    "title": "Find the Missing Number",
    "category": "Math",
    "difficulty": "Easy",
    "question": "An Excel sheet should contain every integer from 1 to 50 exactly once, but the numbers are jumbled and one integer is missing. How can you identify the missing number using only the values present?",
    "conditions": [
      "The expected numbers are all integers from 1 through 50.",
      "Exactly one number is missing.",
      "There are no duplicate numbers.",
      "The order of the numbers does not matter."
    ]
  },
  {
    "id": "four-people-rickety-bridge",
    "title": "Four People on a Rickety Bridge",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "Four people take 1, 2, 7, and 10 minutes respectively to cross a bridge at night. They have one torch, at most two people can cross at once, and anyone crossing must carry the torch. When two people cross together, they move at the slower person's speed. What is the minimum time needed for everyone to cross?",
    "conditions": [
      "The crossing times are 1, 2, 7, and 10 minutes.",
      "At most two people may be on the bridge at once.",
      "The torch must accompany every crossing.",
      "Someone must return with the torch when people remain on the starting side.",
      "A pair crosses at the speed of the slower person."
    ]
  },
  {
    "id": "man-fell-in-well",
    "title": "Man Fell in a Well",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A man is trapped in a 50-meter-deep well. Each day he climbs 4 meters but, if he has not escaped, slips back 3 meters. How many days does it take him to get out?",
    "conditions": [
      "The well is 50 meters deep.",
      "The man climbs 4 meters during each day.",
      "He slips 3 meters after an unsuccessful day.",
      "Once he reaches the top, he escapes immediately and does not slip back."
    ]
  },
  {
    "id": "three-equilateral-triangles-matchsticks",
    "title": "Form Three Equilateral Triangles",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A regular hexagon with three diagonals is constructed from numbered matchsticks. Move exactly four matchsticks to transform the arrangement into exactly three equilateral triangles. Which matchsticks should be moved?",
    "conditions": [
      "The starting arrangement is the numbered matchstick diagram supplied with the puzzle.",
      "Exactly four matchsticks may be moved.",
      "Matchsticks cannot be broken or shortened.",
      "The final arrangement must contain exactly three equilateral triangles."
    ]
  },
  {
    "id": "identical-bottles-pills",
    "title": "Identical Bottles of Pills",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have 10 identical bottles, each containing 100 pills. Pills in 9 bottles weigh exactly 1 gram each, while every pill in one bottle weighs 1.1 grams. Using a precise weighing scale only once, how can you identify the bottle containing the heavier pills?",
    "conditions": [
      "Exactly one bottle contains the heavier 1.1 gram pills.",
      "All pills in the other nine bottles weigh exactly 1 gram.",
      "You may use the weighing scale only once."
    ]
  },
  {
    "id": "circle-division-six-lines",
    "title": "Circle Division by Six Straight Lines",
    "category": "Math",
    "difficulty": "Medium",
    "question": "What is the maximum number of regions into which a circle can be divided using six straight lines?",
    "conditions": [
      "All six lines may be positioned freely.",
      "Each new line should intersect every previous line at a distinct point inside the circle.",
      "No three lines should intersect at the same point."
    ]
  },
  {
    "id": "chain-link-puzzle",
    "title": "Chain Link Puzzle",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "You have 5 separate chain segments, each containing 3 closed links. Opening a link costs $1 and closing an opened link costs $3. You may connect segments only by opening and welding links. What is the minimum cost to create one continuous open-ended chain?",
    "conditions": [
      "There are 5 segments of 3 links each.",
      "Opening one link costs $1.",
      "Closing one opened link costs $3.",
      "The final chain must remain open-ended, not form a loop."
    ]
  },
  {
    "id": "generalized-egg-dropping",
    "title": "Egg Dropping Puzzle",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "You have identical eggs and a building with floors 1 through k. There is an unknown floor f such that an egg survives when dropped from floor f or below and breaks above f. What strategy minimizes the maximum number of drops needed to determine f? In particular, how many drops are required with 2 eggs and 36 floors?",
    "conditions": [
      "An egg that survives can be reused.",
      "A broken egg must be discarded.",
      "All eggs behave identically.",
      "The result is monotonic: once an egg breaks at a floor, it would break at every higher floor."
    ]
  },
  {
    "id": "minimum-apples-guarantee-red",
    "title": "Minimum Apples to Guarantee Red Apples",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "Apple trees lie in four directions and each tree contains exactly K apples. North trees contain no red apples, South trees contain no green apples, West trees contain at least one red apple, and East trees contain some green apples. Without being able to distinguish colors before collecting them, determine whether it is possible to guarantee M red apples and minimize the number collected.",
    "conditions": [
      "Each tree contains exactly K apples.",
      "North trees contain no red apples.",
      "South trees contain only red apples.",
      "Each West tree contains at least one red apple.",
      "East trees provide no guaranteed red apples from the stated information.",
      "The guarantee must hold in the worst case."
    ]
  },
  {
    "id": "snail-and-wall",
    "title": "Snail and Wall",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A snail must climb a 30-foot wall. During each hour it climbs 3 feet, but after an unsuccessful hour it slides down 2 feet. How many hours does it take to reach the top?",
    "conditions": [
      "The wall is 30 feet high.",
      "The snail climbs 3 feet during each hour.",
      "It slides down 2 feet after an hour only if it has not yet reached the top."
    ]
  },
  {
    "id": "1000-light-bulbs",
    "title": "1000 Light Bulbs",
    "category": "Math",
    "difficulty": "Medium",
    "question": "There are 1000 light bulbs, initially OFF, and 1000 people. Person 1 toggles every bulb, person 2 toggles every second bulb, person 3 every third bulb, and so on. What are the final states of bulbs 25, 93, 576, 132, 605, 26, 45, 37, and 36? How many bulbs remain ON?",
    "conditions": [
      "All 1000 bulbs start OFF.",
      "Person n toggles every bulb whose number is divisible by n.",
      "Toggling changes ON to OFF and OFF to ON."
    ]
  },
  {
    "id": "four-alternating-knights",
    "title": "Four Alternating Knights",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "On a 3 × 3 chessboard, two black knights occupy the two upper corners and two white knights occupy the two lower corners. Can legal knight moves transform them into an alternating target arrangement? Find the shortest sequence or prove that no such sequence exists.",
    "conditions": [
      "Only standard chess knight moves are allowed.",
      "A knight cannot land on an occupied square.",
      "The board is exactly 3 × 3."
    ]
  },
  {
    "id": "nine-dots-lateral-thinking",
    "title": "Nine Dots - Lateral Thinking",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Nine dots are arranged in a 3 × 3 grid. Join all nine dots using the minimum number of connected straight lines without lifting your pen from the paper.",
    "conditions": [
      "All nine dots must be crossed by the drawn lines.",
      "The lines must form one continuous stroke.",
      "The pen cannot be lifted.",
      "Lines are allowed to extend beyond the imaginary boundary of the 3 × 3 dot grid."
    ]
  },
  {
    "id": "100-cows-and-milk",
    "title": "100 Cows and Milk",
    "category": "Math",
    "difficulty": "Medium",
    "question": "A milkman has 100 cows numbered from 1 to 100. Cow i produces i litres of milk. He wants to divide all 100 cows among his 10 sons so that every son receives the same total amount of milk. How should the cows be divided?",
    "conditions": [
      "Cow i produces exactly i litres of milk.",
      "All 100 cows must be distributed.",
      "There are 10 sons.",
      "Every son must receive the same total milk production."
    ]
  },
  {
    "id": "one-mile-on-globe",
    "title": "One Mile on the Globe",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "At how many points on Earth can you travel exactly one mile south, then one mile east, and finally one mile north and arrive back at your starting point?",
    "conditions": [
      "Treat Earth as an ideal sphere.",
      "Each leg of the journey is exactly one mile.",
      "Eastward travel follows a circle of latitude."
    ]
  },
  {
    "id": "three-matchsticks-three-squares",
    "title": "Move 3 Matchsticks to Make 3 Squares",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A set of matchsticks is arranged in the given figure. Move exactly 3 matchsticks so that the resulting arrangement contains 3 square boxes.",
    "conditions": [
      "Exactly 3 matchsticks may be moved.",
      "The matchsticks do not have to remain inside the apparent boundary of the original figure.",
      "The puzzle depends on the accompanying starting diagram."
    ]
  },
  {
    "id": "counters-and-board",
    "title": "The Counters and Board",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "Given 2n counters, where n > 1, place all of them on an n × n board so that no row, column, or diagonal contains more than two counters.",
    "conditions": [
      "Exactly 2n counters must be placed.",
      "No row may contain more than two counters.",
      "No column may contain more than two counters.",
      "No diagonal may contain more than two counters.",
      "n is greater than 1."
    ]
  },
  {
    "id": "camel-and-banana",
    "title": "Camel and Banana Puzzle",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "A person has 3000 bananas that must be transported 1000 km by a camel. The camel can carry at most 1000 bananas and consumes 1 banana for every kilometre it travels. Bananas may be stored at intermediate points. What is the maximum number of bananas that can reach the destination?",
    "conditions": [
      "The camel can carry at most 1000 bananas.",
      "The camel consumes 1 banana per kilometre travelled.",
      "The starting supply is 3000 bananas.",
      "The destination is 1000 km away.",
      "Bananas may be cached at intermediate locations."
    ]
  },
  {
    "id": "six-matches-make-nothing",
    "title": "Six Matches - Make Nothing",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "You are given six matchsticks. Rearrange them so that they make 'nothing'.",
    "conditions": [
      "All six matchsticks may be rearranged.",
      "The word 'nothing' does not have to be interpreted literally.",
      "The intended solution is visual."
    ]
  },
  {
    "id": "find-initial-money",
    "title": "Find the Initial Money",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Rama visits 4 temples. At each temple, the money in his pocket first doubles, and then he donates ₹100. After leaving the fourth temple, he has no money left. How much money did he have initially?",
    "conditions": [
      "Rama visits exactly 4 temples.",
      "At each temple his current money doubles before the donation.",
      "He donates exactly ₹100 after the doubling.",
      "After the fourth donation, his balance is ₹0."
    ]
  },
  {
    "id": "cake-three-cuts-eight-pieces",
    "title": "3 Cuts to Make 8 Equal Cake Pieces",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "A round birthday cake must be divided into 8 equal pieces using only 3 straight cuts. Can it be done without stacking or rearranging the pieces?",
    "conditions": [
      "Only 3 straight cuts are allowed.",
      "The cake is treated as a three-dimensional cylindrical object.",
      "The pieces do not need to be moved or stacked between cuts.",
      "All 8 final pieces must have equal volume."
    ]
  },
  {
    "id": "two-creepers-climbing-tree",
    "title": "Two Creepers Climbing a Tree",
    "category": "Math",
    "difficulty": "Medium",
    "question": "Two creepers start from the same point at the bottom of a cylindrical tree trunk and finish at the same height. One spirals clockwise around the trunk 3 times while the other spirals counterclockwise 5 times. How many times do they cross between the bottom and top, excluding both endpoints?",
    "conditions": [
      "The creepers start at the same point.",
      "They finish at the same height.",
      "One makes exactly 3 complete twists.",
      "The other makes exactly 5 complete twists in the opposite direction.",
      "The bottom and top coincidences are not counted."
    ]
  },
  {
    "id": "chessboard-and-dominoes",
    "title": "Chessboard and Dominoes",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "An 8 × 8 chessboard has two diagonally opposite corner squares removed. You are given 31 dominoes, each of which covers exactly two adjacent squares. Can the remaining board be completely covered with the 31 dominoes?",
    "conditions": [
      "Two diagonally opposite corners are removed.",
      "Each domino covers exactly two adjacent squares.",
      "All remaining 62 squares must be covered.",
      "Dominoes cannot overlap."
    ]
  },
  {
    "id": "six-matchsticks-four-triangles",
    "title": "6 Matchsticks to Make 4 Equilateral Triangles",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "How can you arrange 6 identical matchsticks to make 4 equilateral triangles?",
    "conditions": [
      "Exactly 6 identical matchsticks are used.",
      "Each matchstick forms one complete edge.",
      "All four triangles must be equilateral.",
      "The arrangement is not restricted to two dimensions."
    ]
  },
  {
    "id": "three-ants-triangle",
    "title": "3 Ants and Triangle",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Three ants are sitting at the three corners of a triangle. Each ant independently chooses one of the two directions along the triangle's edges and starts moving. If clockwise and counterclockwise are equally likely, what is the probability that at least two ants collide?",
    "conditions": [
      "Each ant independently chooses clockwise or counterclockwise.",
      "Each direction has probability 1/2.",
      "All ants start moving at the same time.",
      "The ants move under the standard puzzle assumption of equal motion along the triangle."
    ]
  },
  {
    "id": "ten-coins-blindfolded",
    "title": "10 Coins Puzzle",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You are blindfolded with 10 coins on a table. Exactly 5 are heads up and 5 are tails up, but you cannot determine which is which by touch. Divide the coins into two groups so that both groups have the same number of heads. You may flip coins.",
    "conditions": [
      "There are exactly 10 coins.",
      "Exactly 5 coins are heads and 5 are tails.",
      "You cannot identify heads or tails by touch.",
      "You may move and flip the coins.",
      "Both final groups must contain the same number of heads."
    ]
  },
  {
    "id": "days-of-month-two-dice",
    "title": "Days of Month Using 2 Dice",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You have two 6-sided dice and may write one digit from 0 to 9 on each face. Arrange the digits so that by placing the dice side by side you can display every date from 01 through 31.",
    "conditions": [
      "Each die has exactly 6 faces.",
      "A single digit is written on each face.",
      "Both dice are used to display each two-digit date.",
      "All dates from 01 through 31 must be possible.",
      "A 6 may be turned upside down and read as 9."
    ]
  },
  {
    "id": "last-palindrome-date",
    "title": "Last Palindrome Date",
    "category": "Math",
    "difficulty": "Medium",
    "question": "October 2, 2001 is written as \"10022001\" in MMDDYYYY format, which is a palindrome. What was the most recent palindrome date before 10/02/2001?",
    "conditions": [
      "Dates are written strictly in MMDDYYYY format.",
      "Leading zeros are included.",
      "The resulting 8-digit string must read the same forwards and backwards.",
      "The date must be a valid calendar date."
    ]
  },
  {
    "id": "ten-balls-five-lines",
    "title": "10 Balls in 5 Lines",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Arrange 10 balls in exactly 5 straight lines so that every line contains exactly 4 balls.",
    "conditions": [
      "Exactly 10 balls are used.",
      "There must be 5 straight lines.",
      "Each line must contain exactly 4 balls.",
      "A ball may belong to more than one line."
    ]
  },
  {
    "id": "round-table-coin-game",
    "title": "Round Table Coin Game",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "Two players have an unlimited supply of identical coins and take turns placing one coin on a perfectly circular table without overlapping existing coins. Player A moves first, and the player who places the last possible coin wins. What strategy guarantees that Player A wins?",
    "conditions": [
      "The table is perfectly circular.",
      "All coins are identical circular coins.",
      "Coins must lie completely on the table.",
      "Coins cannot overlap.",
      "Player A always moves first.",
      "The player making the last legal placement wins."
    ]
  },
  {
    "id": "circle-of-lights",
    "title": "The Circle of Lights",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "There are N > 2 lights arranged in a circle, each initially off. Flipping a switch toggles its own light and the two adjacent lights. What is the minimum number of switch flips required to turn every light on?",
    "conditions": [
      "N is greater than 2.",
      "All lights initially start off.",
      "Switch i toggles light i and its two neighboring lights.",
      "The lights and switches are arranged cyclically.",
      "Only the parity of the number of times each switch is flipped matters."
    ]
  },
  {
    "id": "seven-unit-gold-rod-payment",
    "title": "Pay an Employee Using a 7-Unit Gold Rod",
    "category": "Strategy",
    "difficulty": "Easy",
    "question": "An employee works for 7 days and must receive exactly 1 unit of gold for each completed day. The employer has one 7-unit gold rod and may make at most 2 cuts. How can the employee's total gold equal exactly 1, 2, 3, ..., 7 units at the end of each day?",
    "conditions": [
      "The gold rod has a total length/value of 7 units.",
      "At most 2 cuts may be made.",
      "The employee must hold exactly the day's number of gold units after each day.",
      "The employer may take back previously given pieces and exchange them for other pieces.",
      "The employee cannot spend or otherwise remove any gold during the seven days."
    ]
  },
  {
    "id": "find-anesthetic-injection",
    "title": "Finding the Anesthetic Injection",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "There are 240 injections and exactly one contains an anesthetic. You have 5 rats and 48 hours to identify it. An exposed rat becomes unconscious within the relevant 24-hour testing window, and an unconscious rat cannot be used again. How can you identify the exact injection?",
    "conditions": [
      "Exactly one of the 240 injections contains the anesthetic.",
      "There are 5 rats.",
      "Testing must finish within 48 hours.",
      "Testing is performed in two distinguishable 24-hour rounds.",
      "For each rat, you can distinguish whether it became unconscious in the first round, in the second round, or remained conscious.",
      "A rat that becomes unconscious cannot be used again."
    ]
  },
  {
    "id": "three-bulbs-three-switches",
    "title": "3 Bulbs and 3 Switches",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "Three switches outside a closed room control three bulbs inside, one switch per bulb. You may operate the switches however you like, but may enter the room only once. How can you determine which switch controls each bulb?",
    "conditions": [
      "Each switch controls exactly one bulb.",
      "You may enter the room only once.",
      "After entering, you cannot operate the switches again.",
      "The bulbs become noticeably warm after being switched on for several minutes."
    ]
  },
  {
    "id": "contaminated-pill-jar",
    "title": "Find the Jar with Contaminated Pills",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "Five jars contain pills. Normal pills weigh 10 grams each, but every pill in exactly one jar weighs 9 grams. You may use a digital weighing scale only once. How can you identify the contaminated jar?",
    "conditions": [
      "There are exactly 5 jars.",
      "Every normal pill weighs exactly 10 grams.",
      "Every pill in the contaminated jar weighs exactly 9 grams.",
      "Exactly one jar is contaminated.",
      "Only one weighing is allowed."
    ]
  },
  {
    "id": "two-player-end-coin-game",
    "title": "Two-Player Coin Game",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "An even number of coins with known values are arranged in a row. Two players alternately take one coin from either end. Player A moves first. What strategy guarantees that Player A never finishes with a smaller total value than Player B?",
    "conditions": [
      "The number of coins is even.",
      "All coin values are known before the game begins.",
      "A coin may be taken only from the left or right end.",
      "Both players play strategically.",
      "Player A moves first."
    ]
  },
  {
    "id": "five-pirates-hundred-coins",
    "title": "5 Pirates and 100 Gold Coins",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "Five perfectly rational pirates A, B, C, D, and E are ranked from most senior to most junior and must divide 100 gold coins. The most senior pirate alive proposes a distribution and everyone votes. A proposal passes with at least half the votes, with a tie resolved in favor of the proposer. If rejected, the proposer is eliminated. Pirates prioritize survival, then more coins, then fewer surviving pirates. What is the maximum number of coins A can keep while ensuring his proposal passes?",
    "conditions": [
      "A is most senior and E is most junior.",
      "The most senior pirate alive makes the proposal.",
      "All living pirates, including the proposer, vote.",
      "At least half the votes are sufficient.",
      "A tied vote passes because the proposer has the casting vote.",
      "If a proposal fails, its proposer is eliminated.",
      "Pirates prioritize survival, then maximizing coins, then fewer pirates alive."
    ]
  },
  {
    "id": "five-unit-gold-bar-minimum-cuts",
    "title": "Minimum Cuts for a 5-Unit Gold Bar",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "A worker is hired for 5 days and must have exactly 1 additional unit of gold after each completed day. You have one 5-unit gold bar that may be cut into pieces. What is the minimum number of cuts needed so the worker can hold exactly 1, 2, 3, 4, and 5 units after successive days?",
    "conditions": [
      "The original gold bar is worth 5 units.",
      "The worker must hold exactly the day's number of units after each day.",
      "Previously given pieces may be taken back and exchanged.",
      "The goal is to minimize the number of cuts."
    ]
  },
  {
    "id": "prisoner-policeman-paradox",
    "title": "Prisoner and Policeman Puzzle",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A policeman tells a prisoner to make one statement. If the statement is judged true, the prisoner will be hanged. If it is judged false, the prisoner will be shot. What statement can the prisoner make that makes the stated punishment rules logically inconsistent?",
    "conditions": [
      "A true statement results in hanging.",
      "A false statement results in shooting.",
      "The statement may refer to what will happen to the prisoner.",
      "The rules must be applied consistently with the truth value of the statement."
    ]
  },
  {
    "id": "chameleons-same-color",
    "title": "Chameleons Go on a Date",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "An island has 13 purple, 15 yellow, and 17 maroon chameleons. Whenever two chameleons of different colors meet, both change into the third color. Is it possible for all 45 chameleons eventually to become the same color?",
    "conditions": [
      "Initially there are 13 purple chameleons.",
      "Initially there are 15 yellow chameleons.",
      "Initially there are 17 maroon chameleons.",
      "When two differently colored chameleons meet, both become the third color.",
      "Meetings may occur in any order."
    ]
  },
  {
    "id": "heaven-and-hell-guards",
    "title": "Heaven and Hell",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "Two doors stand before you: one leads to Heaven and the other to Hell. Each door has a guard. One guard always tells the truth and the other always lies, but you do not know which is which. You may ask exactly one question to one guard. How can you guarantee choosing the door to Heaven?",
    "conditions": [
      "Exactly one door leads to Heaven.",
      "The other door leads to Hell.",
      "One guard always tells the truth.",
      "The other guard always lies.",
      "You do not know which guard is which.",
      "You may ask only one question to one guard."
    ]
  },
  {
    "id": "mislabeled-jars",
    "title": "Mislabeled Jars",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "Three jars contain Candies, Sweets, and a mixture of Candies & Sweets. They are labeled \"Candies\", \"Sweets\", and \"Candies & Sweets\", but every label is wrong. What is the minimum number of items you need to pick to correctly label all three jars?",
    "conditions": [
      "Each jar contains either only Candies, only Sweets, or a mixture of both.",
      "All three labels are incorrect.",
      "You can identify an item only after picking it."
    ]
  },
  {
    "id": "cheryls-birthday",
    "title": "Cheryl's Birthday",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Cheryl gives Albert and Bernard ten possible birthday dates: May 15, May 16, May 19, June 17, June 18, July 14, July 16, August 14, August 15, and August 17. Albert learns the month and Bernard learns the day. Albert says, \"I don't know the birthday, but I know Bernard doesn't know either.\" Bernard says, \"At first I didn't know, but now I know.\" Albert then says, \"Now I know too.\" When is Cheryl's birthday?"
  },
  {
    "id": "lion-and-unicorn",
    "title": "The Lion and the Unicorn",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A lion lies on Monday, Tuesday, and Wednesday and tells the truth on the other days. A unicorn lies on Thursday, Friday, and Saturday and tells the truth on the other days. Both say, \"Yesterday I was lying.\" On which day did they make these statements?"
  },
  {
    "id": "farmer-wolf-goat-cabbage",
    "title": "Farmer, Goat, Wolf and Cabbage",
    "category": "Strategy",
    "difficulty": "Easy",
    "question": "A farmer must cross a river with a wolf, a goat, and a cabbage. His boat can carry only himself and one of them. If left alone, the wolf will eat the goat and the goat will eat the cabbage. How can he get everything safely across?",
    "conditions": [
      "The boat carries the farmer plus at most one passenger or item.",
      "The wolf cannot be left alone with the goat.",
      "The goat cannot be left alone with the cabbage.",
      "The wolf and cabbage may safely remain together."
    ]
  },
  {
    "id": "blind-man-and-pills",
    "title": "Blind Man and Pills",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "A blind man has two blue pills and two red pills. He needs exactly one full blue pill and one full red pill each day for two days, but cannot distinguish their colors. How can he safely take the correct dose each day?",
    "conditions": [
      "There are exactly two blue and two red pills.",
      "Each pill can be divided into two equal-dose halves.",
      "He needs the equivalent of one blue and one red pill per day."
    ]
  },
  {
    "id": "rat-poisonous-milk-bottles",
    "title": "Rat and Poisonous Milk Bottles",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Four bottles of milk are available and exactly one is poisonous. A rat dies exactly 10 hours after first drinking the poisoned milk. Using only this rat and a clock that measures whole hours, how can you identify the poisoned bottle within 24 hours?",
    "conditions": [
      "Exactly one of the four bottles is poisonous.",
      "The rat dies exactly 10 hours after drinking poisoned milk.",
      "The death delay is fixed, not variable.",
      "The clock can distinguish whole hours."
    ]
  },
  {
    "id": "measure-six-litres-four-nine",
    "title": "Measure 6 Litres Using 4L and 9L Containers",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "You have an unmarked 4-litre jug and an unmarked 9-litre bucket, plus an unlimited water supply. How can you measure exactly 6 litres?",
    "conditions": [
      "The containers have capacities of exactly 4 L and 9 L.",
      "There are no measurement markings.",
      "Water may be filled, emptied, or poured between containers.",
      "When pouring between containers, continue until the source is empty or the destination is full."
    ]
  },
  {
    "id": "melting-candles",
    "title": "Melting Candles",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Two candles start with the same length and burn uniformly. A thick candle burns completely in 6 hours and a thin candle in 4 hours. They are lit simultaneously. When the thick candle is exactly twice as long as the thin candle, how much time has passed?",
    "conditions": [
      "Both candles have the same initial length.",
      "Both burn uniformly at constant rates.",
      "The thick candle lasts 6 hours.",
      "The thin candle lasts 4 hours."
    ]
  },
  {
    "id": "red-hat-blue-hat",
    "title": "Red Hat vs Blue Hat",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "Three players independently receive a red or blue hat with equal probability. Each can see the other two hats but not their own. Simultaneously, each must say \"Red\", \"Blue\", or \"Pass\". The team wins if at least one player guesses and every guess is correct. What strategy maximizes the team's winning probability?",
    "conditions": [
      "Each hat is independently red or blue with equal probability.",
      "Players agree on a strategy beforehand.",
      "Players cannot communicate after seeing the hats.",
      "At least one player must guess for the team to win.",
      "Every player who guesses must be correct."
    ]
  },
  {
    "id": "joint-family-seven-persons",
    "title": "Joint Family of Seven Persons",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "A family contains L, M, N, O, P, Q, and R. R is a housewife whose husband is a lawyer. N is M's wife. L is an engineer and R's granddaughter. O is N's father-in-law and P's father. P and M are siblings of the same gender. Q is L's brother and M's son. How is L related to O, and how many males are in the family?"
  },
  {
    "id": "nine-students-red-black-hats",
    "title": "9 Students and Red/Black Hats",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "Nine students each wear either a red or black hat. Everyone can see the other eight hats but not their own. They know there is at least one red hat and that there are more black hats than red hats. Nobody can communicate. After one reasoning round nobody knows their hat color, and after a second round nobody knows either. During the third round, some students can finally determine their own hat color. How many red hats are there, and which students can know their color?",
    "conditions": [
      "There are 9 students.",
      "Each hat is either red or black.",
      "There is at least one red hat.",
      "There are more black hats than red hats.",
      "Everyone knows all these facts.",
      "Each student can see every hat except their own.",
      "The fact that nobody answered in earlier rounds becomes common knowledge."
    ]
  },
  {
    "id": "light-all-2014-bulbs",
    "title": "Light All 2014 Bulbs",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "2014 bulbs are arranged in a circle. Exactly two bulbs are initially ON and all others are OFF. A move consists of choosing any bulb and toggling its two neighboring bulbs; the chosen bulb itself does not change. Is it always possible to turn every bulb ON?",
    "conditions": [
      "There are exactly 2014 bulbs arranged in a circle.",
      "Exactly two bulbs initially are ON.",
      "Choosing a bulb toggles only its immediate left and right neighbors.",
      "Toggling changes ON to OFF and OFF to ON."
    ]
  },
  {
    "id": "distribute-water-three-five-eight",
    "title": "Distribute the Water",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "You have containers of capacities 3 L, 5 L, and 8 L. Initially the 8L container is full and the other two are empty. Without losing water, how can you end with exactly 4 L in the 5L container and 4 L in the 8L container?",
    "conditions": [
      "Container capacities are exactly 3 L, 5 L, and 8 L.",
      "Initially the state is 0 L, 0 L, and 8 L.",
      "No water may be lost.",
      "When pouring, continue until the source is empty or the destination is full."
    ]
  },
  {
    "id": "same-number-of-hairs",
    "title": "Can Two People Have the Same Number of Hairs?",
    "category": "Math",
    "difficulty": "Easy",
    "question": "Suppose no human can have more than 200,000 hairs on their head, and a city has 12.3 million residents. Is it guaranteed that at least two residents have exactly the same number of hairs?",
    "conditions": [
      "Hair count is a whole number.",
      "A person may have anywhere from 0 to 200,000 hairs.",
      "The population is 12,300,000."
    ]
  },
  {
    "id": "heavy-ball-2187",
    "title": "Find the Heavy Ball Among 2187 Balls",
    "category": "Strategy",
    "difficulty": "Medium",
    "question": "There are 2187 identical-looking balls and exactly one is heavier than all the others. A two-pan balance scale gives three possible outcomes: left side heavier, right side heavier, or balanced. What is the minimum number of weighings required to guarantee finding the heavy ball?",
    "conditions": [
      "Exactly one ball is heavier.",
      "All normal balls have equal weight.",
      "The balance scale has three outcomes.",
      "The goal is to guarantee identification in the worst case."
    ]
  },
  {
    "id": "handshakes-at-party",
    "title": "28 Handshakes at a Party",
    "category": "Math",
    "difficulty": "Easy",
    "question": "At a small party, every person shakes hands exactly once with every other person. There are 28 handshakes altogether. How many people are at the party?",
    "conditions": [
      "Every pair of people shakes hands exactly once.",
      "Nobody shakes their own hand.",
      "There are exactly 28 handshakes."
    ]
  },
  {
    "id": "three-missionaries-three-cannibals",
    "title": "Missionaries and Cannibals",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "Three missionaries and three cannibals must cross a river using a boat that can carry at most two people. The boat cannot cross empty. On either bank, if missionaries are present, they must never be outnumbered by cannibals. How can everyone cross safely?",
    "conditions": [
      "The boat carries one or two people.",
      "At least one person must operate the boat.",
      "Cannibals may never outnumber missionaries on a bank containing missionaries."
    ]
  },
  {
    "id": "two-doors-two-guards",
    "title": "Two Doors and Two Guards",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "You face two doors. One leads to safety and the other to danger. One guard always tells the truth and the other always lies, but you do not know which is which. You may ask one guard exactly one question. How can you identify the safe door?",
    "conditions": [
      "Exactly one guard always tells the truth.",
      "Exactly one guard always lies.",
      "Both guards know which door is safe.",
      "You may ask only one question to one guard."
    ]
  },
  {
    "id": "knight-and-knave-two-people",
    "title": "Knight and Knave",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "On an island, Knights always tell the truth and Knaves always lie. You meet A and B. A says, \"At least one of us is a Knave.\" What are A and B?",
    "conditions": [
      "Every person is either a Knight or a Knave.",
      "Knights always make true statements.",
      "Knaves always make false statements."
    ]
  },
  {
    "id": "two-fathers-two-sons",
    "title": "Two Fathers and Two Sons",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "Two fathers and two sons go fishing. Each person catches exactly one fish, but they catch only three fish in total. How is this possible?"
  },
  {
    "id": "three-boxes-one-prize",
    "title": "Three Boxes and One Prize",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A prize is hidden in exactly one of three boxes. Box 1 says \"The prize is not here.\" Box 2 says \"The prize is not here.\" Box 3 says \"The prize is in Box 2.\" Exactly one of these three statements is true. Which box contains the prize?",
    "conditions": [
      "Exactly one box contains the prize.",
      "Exactly one of the three statements is true."
    ]
  },
  {
    "id": "clock-strikes-six",
    "title": "Clock Striking Puzzle",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A clock takes 5 seconds to strike 6 times. Assuming equal intervals between strikes, how long will it take to strike 12 times?"
  },
  {
    "id": "average-speed-equal-distances",
    "title": "Average Speed Trap",
    "category": "Math",
    "difficulty": "Medium",
    "question": "A car travels from A to B at 30 km/h and returns over the same distance at 60 km/h. What is its average speed for the entire trip?",
    "conditions": [
      "The distance from A to B is the same as the distance from B to A.",
      "Speeds are constant on each leg."
    ]
  },
  {
    "id": "bat-and-ball",
    "title": "Bat and Ball",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A bat and a ball cost ₹110 in total. The bat costs ₹100 more than the ball. How much does the ball cost?"
  },
  {
    "id": "hundred-doors-divisors",
    "title": "100 Doors",
    "category": "Math",
    "difficulty": "Medium",
    "question": "There are 100 closed doors. On pass 1, you toggle every door. On pass 2, every second door. On pass 3, every third door, and so on until pass 100. Which doors remain open?",
    "conditions": [
      "All 100 doors start closed.",
      "Toggling changes closed to open and open to closed.",
      "On pass k, every door whose number is divisible by k is toggled."
    ]
  },
  {
    "id": "three-digit-lock-clues",
    "title": "Crack the Three-Digit Lock",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "A three-digit lock has the following clues: 682 — one digit is correct and in the correct place. 614 — one digit is correct but in the wrong place. 206 — two digits are correct but both are in the wrong places. 738 — no digit is correct. 780 — one digit is correct but in the wrong place. What is the code?",
    "conditions": [
      "Each clue is exact.",
      "\"One digit\" means exactly one digit.",
      "\"Two digits\" means exactly two digits."
    ]
  },
  {
    "id": "bridge-three-switches-binary",
    "title": "Find the Special Number",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "You must identify one special number from 1 to 8 by asking only three yes-or-no questions. All three questions must be fixed before receiving any answers. Can it always be done?",
    "conditions": [
      "Exactly one number from 1 through 8 is special.",
      "Only three yes-or-no questions may be asked.",
      "Questions cannot depend on earlier answers."
    ]
  },
  {
    "id": "wrong-addition-moving-match",
    "title": "Make the Equation Correct",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Using Roman numerals made from matchsticks, the equation XI + I = X is shown. Move exactly one matchstick to make the statement mathematically correct.",
    "conditions": [
      "Move exactly one matchstick.",
      "Do not break a matchstick.",
      "The final statement must be mathematically valid."
    ]
  },
  {
    "id": "five-machines-five-items",
    "title": "Machines Making Items",
    "category": "Math",
    "difficulty": "Easy",
    "question": "If 5 machines take 5 minutes to make 5 identical items, how long would 100 machines take to make 100 items?",
    "conditions": [
      "All machines work independently at the same constant rate.",
      "Each machine can produce an item simultaneously with the others."
    ]
  },
  {
    "id": "lily-pad-doubling",
    "title": "Lily Pads on a Lake",
    "category": "Math",
    "difficulty": "Easy",
    "question": "A patch of lily pads doubles in area every day. It completely covers a lake on day 48. On which day was the lake half covered?"
  },
  {
    "id": "three-socks-dark-room",
    "title": "Socks in a Dark Room",
    "category": "Logic",
    "difficulty": "Easy",
    "question": "A drawer contains black and white socks. The room is completely dark, so you cannot distinguish their colors. What is the minimum number of socks you must take to guarantee getting a matching pair?",
    "conditions": [
      "There are only two possible sock colors: black and white.",
      "There are enough socks of each color.",
      "Colors cannot be identified while choosing."
    ]
  },
  {
    "id": "eight-people-island-eyes",
    "title": "Blue-Eyed Islanders",
    "category": "Logic",
    "difficulty": "Hard",
    "question": "On an island, every person can see everyone else's eye color but cannot see their own. Nobody may discuss eye colors. Everyone is a perfect logician and knows everyone else is too. A visitor publicly announces, \"I can see at least one person with blue eyes.\" If exactly 8 islanders have blue eyes, on which night do the blue-eyed islanders leave, assuming anyone who deduces their own eye color must leave that night?",
    "conditions": [
      "Exactly 8 islanders have blue eyes.",
      "Everyone sees everyone else's eyes but not their own.",
      "Everyone is a perfect logician.",
      "The visitor's statement is heard publicly by everyone.",
      "The fact that nobody has left on previous nights is observable."
    ]
  },
  {
    "id": "poisoned-wine-binary-testing",
    "title": "1000 Bottles and 10 Test Strips",
    "category": "Strategy",
    "difficulty": "Hard",
    "question": "Exactly one of 1000 wine bottles is poisoned. You have 10 test strips. A strip turns positive if any poisoned wine is placed on it, but results appear only after 24 hours, so there is only one testing round. Can you identify the poisoned bottle?",
    "conditions": [
      "Exactly one bottle is poisoned.",
      "There are exactly 10 test strips.",
      "Each strip can receive drops from multiple bottles.",
      "All results are obtained simultaneously after one testing round."
    ]
  },
  {
    "id": "missing-dollar-fallacy",
    "title": "The Missing Dollar",
    "category": "Logic",
    "difficulty": "Medium",
    "question": "Three people pay ₹300 for a room, ₹100 each. Later the hotel realizes the room costs ₹250 and sends ₹50 back. The messenger keeps ₹20 and returns ₹10 to each guest. Each guest therefore paid ₹90, totaling ₹270. Adding the messenger's ₹20 gives ₹290. Where did the missing ₹10 go?",
    "conditions": [
      "The guests initially pay ₹300.",
      "The hotel ultimately keeps ₹250.",
      "The messenger keeps ₹20.",
      "The guests receive ₹30 back in total."
    ]
  },
  {
    "id": "two-children-gender",
    "title": "At Least One Boy",
    "category": "Math",
    "difficulty": "Medium",
    "question": "A family has exactly two children. Assume each child is independently equally likely to be a boy or girl. You learn that at least one child is a boy. What is the probability that both children are boys?",
    "conditions": [
      "There are exactly two children.",
      "Each child's gender is independently boy or girl with equal probability.",
      "The information is simply \"at least one is a boy\"; no special observation procedure is involved."
    ]
  }
];

export const getPuzzleById = (id: string): Puzzle | undefined =>
  puzzles.find(puzzle => puzzle.id === id);

/** Pick one puzzle per local calendar day, consistently across app launches. */
export function getDailyPuzzle(date = new Date()): Puzzle {
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 2166136261;
  for (const char of day) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return puzzles[(hash >>> 0) % puzzles.length];
}

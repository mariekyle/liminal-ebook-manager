// Category-specific poetic phrases for library browsing
// {count} is replaced with actual book count

export const categoryPhrases = {
  '': [ // All books
    "{count} doors. Wander freely.",
    "{count} stories waiting to be remembered.",
    "{count} worlds. Browse without a destination.",
    "{count} titles. Nothing here expires.",
    "{count} covers. So many places to land.",
    "{count} thresholds. Take your time.",
    "{count} quiet companions. No rush.",
    "{count} possibilities. The right one will find you.",
    "{count} journeys. A fresh page awaits.",
    "{count} escapes. Whenever you're ready.",
    "{count} invitations. Browse at your own pace.",
  ],
  'Fiction': [
    "{count} invented worlds. Which one calls to you?",
    "{count} lives unlived. Wander freely.",
    "{count} doorways to elsewhere.",
    "{count} stories. Every one a small escape.",
    "{count} fictions. All of them true in their way.",
    "{count} imagined places. Real enough when you're there.",
    "{count} other lives to borrow.",
    "{count} adventures, patiently awaiting.",
    "{count} portals. No passport required.",
    "{count} dreams waiting to be opened.",
  ],
  'Non-Fiction': [
    "{count} ways to understand the world.",
    "{count} voices to learn from.",
    "{count} questions answered. More to ask.",
    "{count} paths to knowing.",
    "{count} teachers on your shelf.",
    "{count} windows onto what is.",
    "{count} truths. Take what resonates.",
    "{count} lenses. See something new.",
    "{count} ideas. No quiz at the end.",
    "{count} discoveries. At your own pace.",
  ],
  'FanFiction': [
    "{count} reimagined worlds. Old friends, new doors.",
    "{count} love letters to stories that mattered.",
    "{count} what-ifs. Explore freely.",
    "{count} familiar faces in unfamiliar places.",
    "{count} gifts from fellow dreamers.",
    "{count} alternate doors. The characters remember you.",
    "{count} labors of love. Handle with joy.",
    "{count} worlds extended. The story never really ends.",
    "{count} passionate detours. Wander without guilt.",
    "{count} reunions. Welcome back.",
    "{count} works of devotion. Someone wrote this just for you.",
    "{count} threads to follow home.",
  ],
  'Uncategorized': [
    "{count} stories yet to be sorted. No hurry.",
    "{count} mysteries. Even you don't know what's here.",
    "{count} unmarked doors. Surprise yourself.",
    "{count} unclaimed adventures.",
    "{count} reads without a box. They don't mind.",
    "{count} secrets on your shelf.",
    "{count} wildcards. Browse and discover.",
    "{count} stories awaiting introduction.",
    "{count} unnamed paths. Wander in.",
    "{count} journeys uncharted. The best kind.",
  ],
}

export function getRandomPhrase(category, count) {
  const phrases = categoryPhrases[category] || categoryPhrases['']
  const randomIndex = Math.floor(Math.random() * phrases.length)
  return phrases[randomIndex].replace('{count}', count)
}




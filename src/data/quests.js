// ═══════════════════════════════════════════════════════════════════
// Quest Library — Activities mapped to BC Core Competencies
// Each quest targets a primary sub-competency and profile level,
// with optional cross-competency connections
// ═══════════════════════════════════════════════════════════════════

export const QUESTS = {
  communication: [
    {
      id: "c1", title: "Story Spark", icon: "🎙️",
      desc: "Tell a short story about your favourite place. What makes it special? How does it make you feel?",
      sub: "communicating", alsoTouches: ["positiveIdentity"],
      difficulty: "easy", profile: 2, minutes: 8,
    },
    {
      id: "c2", title: "Team Builders", icon: "🎉",
      desc: "Plan a pretend party with someone. Decide who does what and work together!",
      sub: "collaborating",
      difficulty: "medium", profile: 3, minutes: 10,
    },
    {
      id: "c3", title: "Picture Words", icon: "🎨",
      desc: "Draw something, then explain it so clearly that someone else could draw it without seeing yours.",
      sub: "communicating", alsoTouches: ["creativeThinking"],
      difficulty: "medium", profile: 3, minutes: 12,
    },
    {
      id: "c4", title: "Listening Detective", icon: "🔎",
      desc: "Listen to someone tell you about their day. Ask 3 questions that help you understand more.",
      sub: "communicating", alsoTouches: ["socialAwareness"],
      difficulty: "medium", profile: 4, minutes: 8,
    },
    {
      id: "c5", title: "Bridge Builder", icon: "🌉",
      desc: "Your group disagrees on something. Find a solution that includes everyone's best ideas.",
      sub: "collaborating", alsoTouches: ["criticalThinking"],
      difficulty: "hard", profile: 5, minutes: 15,
    },
    {
      id: "c6", title: "Audience Switch", icon: "🎭",
      desc: "Explain the same topic two different ways: once for a younger child, once for a grown-up.",
      sub: "communicating",
      difficulty: "hard", profile: 5, minutes: 12,
    },
  ],

  thinking: [
    {
      id: "t1", title: "What If?", icon: "💡",
      desc: "Pick an everyday object and invent 5 wild new uses for it. The sillier, the better!",
      sub: "creativeThinking",
      difficulty: "easy", profile: 2, minutes: 7,
    },
    {
      id: "t2", title: "Mystery Box", icon: "🔍",
      desc: "Use clues to figure out what's hidden. Explain your reasoning step by step.",
      sub: "criticalThinking",
      difficulty: "medium", profile: 3, minutes: 10,
    },
    {
      id: "t3", title: "Remix Lab", icon: "🧪",
      desc: "Take two completely different ideas and mash them together into something new.",
      sub: "creativeThinking", alsoTouches: ["communicating"],
      difficulty: "medium", profile: 4, minutes: 12,
    },
    {
      id: "t4", title: "Truth Seeker", icon: "⚖️",
      desc: "Find two different opinions about the same topic. What evidence supports each?",
      sub: "criticalThinking",
      difficulty: "hard", profile: 4, minutes: 15,
    },
    {
      id: "t5", title: "Invention Studio", icon: "🛠️",
      desc: "Design something that solves a problem you've noticed. Sketch it and explain how it works.",
      sub: "creativeThinking", alsoTouches: ["personalAwareness"],
      difficulty: "hard", profile: 5, minutes: 15,
    },
    {
      id: "t6", title: "Devil's Advocate", icon: "🤔",
      desc: "Take a position you disagree with and make the best case for it. What did you learn?",
      sub: "criticalThinking", alsoTouches: ["socialAwareness"],
      difficulty: "hard", profile: 5, minutes: 12,
    },
  ],

  personalSocial: [
    {
      id: "p1", title: "My Superpower", icon: "✨",
      desc: "What makes you YOU? Draw or describe your unique superpower.",
      sub: "positiveIdentity",
      difficulty: "easy", profile: 2, minutes: 8,
    },
    {
      id: "p2", title: "Calm Cloud", icon: "☁️",
      desc: "Practice a breathing exercise. Breathe in for 4, hold for 4, out for 4. Notice how your body feels.",
      sub: "personalAwareness",
      difficulty: "easy", profile: 2, minutes: 5,
    },
    {
      id: "p3", title: "Kindness Quest", icon: "💛",
      desc: "Do something kind for someone today. Reflect: how did it feel for you? How do you think they felt?",
      sub: "socialAwareness", alsoTouches: ["personalAwareness"],
      difficulty: "medium", profile: 3, minutes: 10,
    },
    {
      id: "p4", title: "My Story Map", icon: "🗺️",
      desc: "Draw a map of important places, people, and memories that make you who you are.",
      sub: "positiveIdentity", alsoTouches: ["communicating"],
      difficulty: "medium", profile: 4, minutes: 12,
    },
    {
      id: "p5", title: "Goal Climber", icon: "🏔️",
      desc: "Set one specific goal for this week. Break it into 3 small steps. Check in each day.",
      sub: "personalAwareness",
      difficulty: "hard", profile: 4, minutes: 10,
    },
    {
      id: "p6", title: "Community Lens", icon: "🌍",
      desc: "Notice something in your community that could be better. Who is affected? What's one thing you could do?",
      sub: "socialAwareness", alsoTouches: ["criticalThinking"],
      difficulty: "hard", profile: 5, minutes: 15,
    },
  ]
};

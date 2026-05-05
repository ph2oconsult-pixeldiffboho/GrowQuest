// ═══════════════════════════════════════════════════════════════════
// Official BC Core Competencies Curriculum Data
// Source: https://curriculum.gov.bc.ca/competencies
// All profile wording from the official sub-competencies PDF
// ═══════════════════════════════════════════════════════════════════

export const COMPETENCIES = {
  communication: {
    name: "Communication",
    color: "#2563EB",
    colorLight: "#DBEAFE",
    gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
    icon: "💬",
    realm: "Echo Isles",
    realmDesc: "Where voices carry across shimmering waters",
    subCompetencies: {
      communicating: {
        name: "Communicating",
        facets: [
          "Connecting & Engaging with Others",
          "Acquiring, Interpreting & Presenting Information",
          "Focusing on Intent & Purpose"
        ],
        profiles: [
          "I respond meaningfully to communication from peers and adults.",
          "I talk and listen to people I know. I can communicate for a purpose.",
          "I communicate purposefully, using forms and strategies I have practiced.",
          "I communicate clearly and purposefully, using a variety of forms appropriately.",
          "I communicate confidently, showing attention to my audience and purpose.",
          "I communicate with intentional impact, in well-constructed forms."
        ]
      },
      collaborating: {
        name: "Collaborating",
        facets: [
          "Working Collectively",
          "Supporting & Encouraging Others",
          "Shared Responsibility"
        ],
        profiles: [
          "I can participate with others in familiar situations.",
          "I cooperate with others for specific purposes.",
          "I contribute during group activities and share roles and responsibilities.",
          "I can confidently interact and build relationships to further shared goals.",
          "I can facilitate group processes and encourage collective responsibility.",
          "I can connect my group with broader networks for various purposes."
        ]
      }
    }
  },
  thinking: {
    name: "Thinking",
    color: "#7C3AED",
    colorLight: "#EDE9FE",
    gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    icon: "🧠",
    realm: "Wonder Peaks",
    realmDesc: "Mountains of curiosity and discovery",
    subCompetencies: {
      creativeThinking: {
        name: "Creative Thinking",
        facets: [
          "Creating & Innovating",
          "Generating & Incubating",
          "Evaluating & Developing"
        ],
        profiles: [
          "I get ideas when I play.",
          "I can get new ideas or build on others' ideas to create new things.",
          "I can get new ideas in areas I'm interested in and build skills to make them work.",
          "I can get new ideas or reinterpret others' ideas in novel ways.",
          "I can think outside the box and persevere to develop innovative ideas.",
          "I can develop a body of creative work over time in an area of passion."
        ]
      },
      criticalThinking: {
        name: "Critical & Reflective Thinking",
        facets: [
          "Analyzing & Critiquing",
          "Questioning & Investigating",
          "Designing & Developing",
          "Reflecting & Assessing"
        ],
        profiles: [
          "I can explore materials and actions.",
          "I can use evidence to make simple judgments.",
          "I can ask questions and consider options using observation and imagination.",
          "I can combine new evidence with what I know to develop reasoned conclusions.",
          "I can evaluate well-chosen evidence to identify alternatives and implications.",
          "I can examine evidence from various perspectives to analyze complex issues."
        ]
      }
    }
  },
  personalSocial: {
    name: "Personal & Social",
    color: "#059669",
    colorLight: "#D1FAE5",
    gradient: "linear-gradient(135deg, #10B981, #047857)",
    icon: "🌱",
    realm: "Heartwood Grove",
    realmDesc: "A living forest where roots connect all things",
    subCompetencies: {
      positiveIdentity: {
        name: "Positive Personal & Cultural Identity",
        facets: [
          "Understanding Relationships & Cultural Contexts",
          "Recognizing Personal Values & Choices",
          "Identifying Personal Strengths & Abilities"
        ],
        profiles: [
          "I am aware of myself as different from others.",
          "I am aware of different aspects of myself.",
          "I can describe different aspects of my identity.",
          "I have pride in who I am. I am part of larger communities.",
          "I understand that my identity is influenced by many aspects of my life.",
          "I can identify how my life experiences have contributed to who I am."
        ]
      },
      personalAwareness: {
        name: "Personal Awareness & Responsibility",
        facets: [
          "Self-Advocating",
          "Self-Regulating",
          "Well-Being"
        ],
        profiles: [
          "I can show joy and express some wants, needs, and preferences.",
          "I can seek out experiences that make me feel happy and proud.",
          "I can make choices that help me meet my needs and increase my well-being.",
          "I can recognize my strengths and use strategies to manage stress and reach goals.",
          "I recognize my value and take responsibility for my choices and achievements.",
          "I can find internal motivation and act on opportunities for self-growth."
        ]
      },
      socialAwareness: {
        name: "Social Awareness & Responsibility",
        facets: [
          "Building Relationships",
          "Empathy",
          "Contributing to Community & Caring for the Environment"
        ],
        profiles: [
          "I can be aware of others and my surroundings.",
          "I can interact with others and my surroundings respectfully.",
          "I can interact with others and the environment respectfully and thoughtfully.",
          "I can take purposeful action to support others and the environment.",
          "I can advocate and take action for my communities and the natural world.",
          "I can initiate positive, sustainable change for others and the environment."
        ]
      }
    }
  }
};

export const AVATARS = [
  { id: "owl",     emoji: "🦉", name: "Wise Owl",       desc: "Curious and thoughtful",  evolutions: ["🥚","🐣","🐥","🦉","🦉","🦉"] },
  { id: "fox",     emoji: "🦊", name: "Clever Fox",     desc: "Creative and quick",       evolutions: ["🥚","🐣","🐥","🦊","🦊","🦊"] },
  { id: "bear",    emoji: "🐻", name: "Kind Bear",      desc: "Strong and caring",        evolutions: ["🥚","🐣","🐥","🐻","🐻","🐻"] },
  { id: "dolphin", emoji: "🐬", name: "Bright Dolphin", desc: "Playful and social",       evolutions: ["🥚","🐣","🐥","🐬","🐬","🐬"] },
  { id: "eagle",   emoji: "🦅", name: "Bold Eagle",     desc: "Brave and focused",        evolutions: ["🥚","🐣","🐥","🦅","🦅","🦅"] },
  { id: "deer",    emoji: "🦌", name: "Gentle Deer",    desc: "Calm and aware",           evolutions: ["🥚","🐣","🐥","🦌","🦌","🦌"] },
  { id: "orca",    emoji: "🐋", name: "Team Orca",      desc: "A leader and friend",      evolutions: ["🥚","🐣","🐥","🐋","🐋","🐋"] },
  { id: "raven",   emoji: "🪶", name: "Story Raven",    desc: "Wise storyteller",         evolutions: ["🥚","🐣","🐥","🪶","🪶","🪶"] },
];

export const EVOLUTION_TITLES = ["Egg", "Hatchling", "Fledgling", "Explorer", "Champion", "Legend"];

export const AGE_GROUPS = [
  { id: "early",        label: "Early Years",   range: "Ages 4–6",  emoji: "🌟" },
  { id: "primary",      label: "Primary",       range: "Ages 6–9",  emoji: "🚀" },
  { id: "intermediate", label: "Intermediate",  range: "Ages 9–12", emoji: "⚡" },
];

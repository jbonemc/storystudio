export interface EpisodeTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
}

export interface EpisodeDownload {
  title: string;
  description: string;
  href: string;
  filename: string;
}

export interface CoreIdea {
  title: string;
  description: string;
}

export interface Episode {
  number: 1 | 2 | 3;
  slug: string;
  title: string;
  subtitle: string;
  colour: string;
  colourLight: string;
  colourCSS: string;
  description: string;
  coreIdeas: CoreIdea[];
  tools: EpisodeTool[];
  downloads: EpisodeDownload[];
}

export const episodes: Episode[] = [
  {
    number: 1,
    slug: "1-language",
    title: "Language",
    subtitle: "The Building Blocks of Story",
    colour: "ep1",
    colourLight: "ep1-light",
    colourCSS: "#C4B3D4",
    description:
      "Every great story is built from three types of language. Visual language begs us to see. Emotional language urges us to feel. Logical language urges us to believe. Master these building blocks and you can make any audience lean forward.",
    coreIdeas: [
      {
        title: "Visual Language",
        description:
          "Language that paints pictures in the listener's mind. Metaphors, scenarios, and sensory detail that make abstract ideas concrete. When you say 'imagine walking into a room where...' you are using visual language.",
      },
      {
        title: "Emotional Language",
        description:
          "Language that creates feelings. Joy, outrage, hope, urgency. Emotional language is what makes people care enough to act. Facts inform, but emotion motivates.",
      },
      {
        title: "Logical Language",
        description:
          "Facts, statistics, evidence, and reasoning that give your story credibility. One powerful, well-framed statistic beats ten charts. Logical language is what makes a sceptic believe.",
      },
      {
        title: "Brute Creativity",
        description:
          "A technique for forcing fresh metaphors: pick a random object and use it to explain your idea. The unexpected connection often produces the most memorable language.",
      },
      {
        title: "Prisming",
        description:
          "Your story has many vantage points. List the people affected by your work and retell your story from their perspective. Each 'prism' reveals a new angle that resonates with a different audience.",
      },
      {
        title: "The Opposites Device",
        description:
          "Think about how you usually talk about your work, then say the opposite. This technique breaks you out of habitual phrasing and often lands on something far more interesting and memorable.",
      },
    ],
    tools: [
      {
        id: "metaphor-generator",
        title: "Metaphor Generator",
        description:
          "Paste a description of your work and get fresh, vivid metaphors from everyday life that make your ideas instantly understandable.",
        href: "/episode/1-language/metaphor-generator",
        icon: "Lightbulb",
      },
      {
        id: "language-analyser",
        title: "Language Analyser",
        description:
          "Paste any paragraph and see which parts use Visual, Emotional, or Logical language — with suggestions to strengthen the balance.",
        href: "/episode/1-language/language-analyser",
        icon: "BarChart3",
      },
    ],
    downloads: [
      {
        title: "Language Worksheet",
        description: "Printable exercises for Brute Creativity, Emotional Language, Numbers, Prisming and Opposites.",
        href: "/downloads/Story-Studio-Worksheet.pdf",
        filename: "Story-Studio-Worksheet.pdf",
      },
    ],
  },
  {
    number: 2,
    slug: "2-story",
    title: "Story",
    subtitle: "Structure & Techniques",
    colour: "ep2",
    colourLight: "ep2-light",
    colourCSS: "#E8B4C8",
    description:
      "A story is not a luxury — it is the most efficient technology humans have ever invented for transferring ideas from one mind to another. In this episode you learn repeatable structures that turn any content into a compelling narrative.",
    coreIdeas: [
      {
        title: "Problem - Inspiration - Payoff (PIP)",
        description:
          "The core Story Studio framework. Problem names the injustice or gap. Inspiration shows what is unique about your approach. Payoff describes how the world looks if you succeed. Together they build an irresistible case.",
      },
      {
        title: "Setup - Conflict - Resolution",
        description:
          "The classic three-act structure. Set the scene, introduce the tension, then resolve it. The conflict is what makes people keep listening — never skip it.",
      },
      {
        title: "Past - Event - Present",
        description:
          "A simple structure for personal stories: how things were, what happened to change them, and where things stand now. Ideal for origin stories and case studies.",
      },
      {
        title: "Suspense",
        description:
          "Do not give away the ending too early. Build towards the turning point. The audience needs to feel the tension before the resolution — that is what makes a story land.",
      },
      {
        title: "The Opposites Device (in Story)",
        description:
          "Take your usual narrative and flip it. Start from the end, tell it from the antagonist's view, or frame success as failure. Unexpected structure makes familiar content fresh.",
      },
      {
        title: "Iteration",
        description:
          "Tell your story three times. Each telling gets tighter, clearer, and more powerful. The best communicators do not have one version of their story — they have a version they have told a hundred times.",
      },
    ],
    tools: [
      {
        id: "story-coach",
        title: "Story Structure Coach",
        description:
          "Input a rough story or anecdote and see it restructured into PIP, Setup-Conflict-Resolution, and Past-Event-Present formats with coaching notes.",
        href: "/episode/2-story/story-coach",
        icon: "BookOpen",
      },
      {
        id: "prisming",
        title: "Prisming Tool",
        description:
          "Describe your work and discover 5+ different perspectives from which to tell its story. See your narrative through the eyes of patients, funders, communities, and more.",
        href: "/episode/2-story/prisming",
        icon: "RefreshCw",
      },
    ],
    downloads: [
      {
        title: "Story Worksheet",
        description: "Printable exercises for story structure, prisming, and the opposites device.",
        href: "/downloads/Story-Studio-Worksheet.pdf",
        filename: "Story-Studio-Worksheet.pdf",
      },
    ],
  },
  {
    number: 3,
    slug: "3-audience",
    title: "Audience",
    subtitle: "Sharing the Story & Delivery",
    colour: "ep3",
    colourLight: "ep3-light",
    colourCSS: "#F2C4A8",
    description:
      "The best story in the world means nothing if it does not reach the right person in the right way. This episode focuses on adapting your communication to your audience, handling media interviews, and delivering with confidence.",
    coreIdeas: [
      {
        title: "The Content Tool",
        description:
          "Your 13-item master plan: Behaviour Change + Should Statement + 3 Messages (PIP), each backed by a Story, a Statistic, and a Soundbite. This is the tool that pulls everything together.",
      },
      {
        title: "Blocking & Bridging",
        description:
          "Techniques for navigating difficult questions in interviews. Block the question you do not want to answer, then bridge to the message you do. 'The important issue is not X, it is Y.'",
      },
      {
        title: "Communication Barriers",
        description:
          "Six types of barrier that stop your message getting through: Physical, Cultural, Language, Perceptual, Interpersonal, and Gendered. Awareness of these helps you adapt your delivery.",
      },
      {
        title: "Active Listening",
        description:
          "Great communicators are great listeners. Observation, mode-switching, and check-ins help you read your audience in real time and adjust your approach.",
      },
      {
        title: "Audience Adaptation",
        description:
          "The same story told to a funder, a journalist, and a patient needs to be shaped differently each time. Understanding format and audience is what separates good communicators from great ones.",
      },
      {
        title: "Delivery",
        description:
          "Confidence, non-verbal communication, voice use, and energy. Speak slowly, use descriptive language, be animated, and keep answers conversational rather than speech-like.",
      },
    ],
    tools: [
      {
        id: "content-tool",
        title: "Content Tool",
        description:
          "Build your complete 13-item communication master plan with AI coaching at every step. The flagship Story Studio tool.",
        href: "/episode/3-audience/content-tool",
        icon: "Target",
      },
      {
        id: "interview-prep",
        title: "Interview Prep Coach",
        description:
          "Enter your topic and the interview format. Get likely questions, blocking & bridging responses, and delivery coaching.",
        href: "/episode/3-audience/interview-prep",
        icon: "Mic",
      },
    ],
    downloads: [
      {
        title: "Content Tool (Printable)",
        description: "The one-page Content Tool template — fill in your 13-item plan by hand.",
        href: "/downloads/Content-Tool-Printable.pdf",
        filename: "Content-Tool-Printable.pdf",
      },
      {
        title: "How to Be Interviewed",
        description: "Complete guide to preparing for media interviews: before, during, and after.",
        href: "/downloads/How-to-Be-Interviewed.pdf",
        filename: "How-to-Be-Interviewed.pdf",
      },
    ],
  },
];

export function getEpisode(slug: string): Episode | undefined {
  return episodes.find((e) => e.slug === slug);
}

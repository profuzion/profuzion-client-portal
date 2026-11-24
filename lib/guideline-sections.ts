export const guidelineSections = [
  {
    key: "story",
    title: "Our story",
    group: "Foundation",
    prompt: "Origins, milestones and what the brand stands for.",
  },
  {
    key: "purpose",
    title: "Purpose & positioning",
    group: "Foundation",
    prompt:
      "Why the brand exists, its value proposition and what makes it different.",
  },
  {
    key: "mission",
    title: "Mission, vision & values",
    group: "Foundation",
    prompt:
      "The work today, the future ambition and the principles behind decisions.",
  },
  {
    key: "audience",
    title: "Our audience",
    group: "Foundation",
    prompt:
      "Who you serve, what matters to them and the problems you help solve.",
  },
  {
    key: "personality",
    title: "Brand personality",
    group: "Expression",
    prompt: "The traits that shape how the brand looks, sounds and behaves.",
  },
  {
    key: "voice",
    title: "Voice & tone",
    group: "Expression",
    prompt:
      "Writing principles, preferred language, words to avoid and example copy.",
  },
  {
    key: "messaging",
    title: "Key messages",
    group: "Expression",
    prompt: "Tagline, elevator pitch, key messages and calls to action.",
  },
  {
    key: "logoRules",
    title: "Logo usage",
    group: "Identity",
    prompt:
      "Clear space, minimum sizes, approved backgrounds, lockups and incorrect usage.",
  },
  {
    key: "colourRules",
    title: "Colour in use",
    group: "Identity",
    prompt:
      "Colour proportions, approved pairings, accessibility and verified print specifications.",
  },
  {
    key: "typeRules",
    title: "Typography in use",
    group: "Identity",
    prompt:
      "Typeface names, weights, hierarchy, sizes, spacing, fallbacks and licence information.",
  },
  {
    key: "imagery",
    title: "Photography & imagery",
    group: "Application",
    prompt:
      "Subjects, composition, lighting, treatments, cropping and visual references.",
  },
  {
    key: "graphics",
    title: "Graphic language",
    group: "Application",
    prompt: "Icons, patterns, illustrations, textures and how to combine them.",
  },
  {
    key: "layout",
    title: "Layout & composition",
    group: "Application",
    prompt:
      "Grids, spacing, alignment and relationships between imagery and typography.",
  },
  {
    key: "applications",
    title: "Brand applications",
    group: "Application",
    prompt:
      "Guidance for social posts, presentations, stationery, packaging, signage and digital experiences.",
  },
  {
    key: "motion",
    title: "Motion & video",
    group: "Application",
    prompt:
      "Animation, transitions, captions, opening and closing frames, and audio direction.",
  },
] as const;
export type GuidelineKey = (typeof guidelineSections)[number]["key"];

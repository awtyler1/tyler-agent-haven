export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  vimeoId: string;
  vimeoHash: string;
  startTime: number;
  module: string;
  moduleOrder: number;
  videoOrder: number;
  thumbnailUrl?: string;
}

export const trainingVideos: TrainingVideo[] = [
  {
    id: "1",
    title: "The Basics: Understanding Medicare",
    description: "Foundation overview of Medicare Parts A & B, premiums, IRMAA, and work credit requirements.",
    duration: "1h 25min",
    vimeoId: "1153782194",
    vimeoHash: "513a2e851c",
    startTime: 0,
    module: "Day 1",
    moduleOrder: 1,
    videoOrder: 1,
  },
  {
    id: "2",
    title: "Medicare Advantage & Enrollment Periods",
    description: "Deep dive into Part C, HMO vs PPO, co-pays vs co-insurance, and all major enrollment periods.",
    duration: "1h 50min",
    vimeoId: "1153790623",
    vimeoHash: "bf55d8515b",
    startTime: 0,
    module: "Day 2",
    moduleOrder: 2,
    videoOrder: 1,
  },
  {
    id: "3",
    title: "Government Resources & Medicare Supplements Intro",
    description: "Navigating Medicare.gov, SSA.gov, Medicaid basics, and introduction to Medigap plans.",
    duration: "2h 9min",
    vimeoId: "1153791147",
    vimeoHash: "ca98c4ab2e",
    startTime: 0,
    module: "Day 3",
    moduleOrder: 3,
    videoOrder: 1,
  },
  {
    id: "4",
    title: "Medicare Supplements Deep Dive",
    description: "Complete Medigap coverage including plan letters, underwriting, guaranteed issue rights, and compliance.",
    duration: "2h 20min",
    vimeoId: "1153793482",
    vimeoHash: "80a275eefa",
    startTime: 0,
    module: "Day 4",
    moduleOrder: 4,
    videoOrder: 1,
  },
  {
    id: "5",
    title: "Part D & Special Needs Plans",
    description: "Prescription drug tiers, coverage phases, donut hole, D-SNPs, C-SNPs, and Extra Help program.",
    duration: "2h 12min",
    vimeoId: "1153794060",
    vimeoHash: "1effc68190",
    startTime: 0,
    module: "Day 5",
    moduleOrder: 5,
    videoOrder: 1,
  },
  {
    id: "6",
    title: "Marketing Strategies for AEP",
    description: "Proven marketing approaches for Annual Enrollment Period success.",
    duration: "1h 55min",
    vimeoId: "1153794488",
    vimeoHash: "5c21b38ac7",
    startTime: 0,
    module: "Day 6",
    moduleOrder: 6,
    videoOrder: 1,
  },
  {
    id: "7",
    title: "Industry News & Medigap Quoting",
    description: "Staying current with industry changes and Medigap quoting techniques.",
    duration: "1h 55min",
    vimeoId: "1153794702",
    vimeoHash: "e81236f9aa",
    startTime: 0,
    module: "Day 7",
    moduleOrder: 7,
    videoOrder: 1,
  },
  {
    id: "8",
    title: "Connecture & Quoting Systems",
    description: "Hands-on training with Connecture and other quoting platforms.",
    duration: "2h 9min",
    vimeoId: "1153795228",
    vimeoHash: "e1584a1a79",
    startTime: 0,
    module: "Day 8",
    moduleOrder: 8,
    videoOrder: 1,
  },
  {
    id: "9",
    title: "Power of Attorney & Quoting Workflow",
    description: "Handling POA situations and efficient quoting workflows.",
    duration: "1h 55min",
    vimeoId: "1153796277",
    vimeoHash: "c3fbbb04b9",
    startTime: 0,
    module: "Day 9",
    moduleOrder: 9,
    videoOrder: 1,
  },
  {
    id: "11",
    title: "Industry Landscape & Drug Plans",
    description: "Understanding the Medicare industry landscape and Part D drug plan details.",
    duration: "1h 25min",
    vimeoId: "1153797715",
    vimeoHash: "e2f55f91cf",
    startTime: 0,
    module: "Day 11",
    moduleOrder: 11,
    videoOrder: 1,
  },
  {
    id: "12",
    title: "Carrier Portals & Enrollment",
    description: "Navigating carrier portals and completing enrollments.",
    duration: "1h 3min",
    vimeoId: "1153797995",
    vimeoHash: "f056700663",
    startTime: 0,
    module: "Day 12",
    moduleOrder: 12,
    videoOrder: 1,
  },
  {
    id: "13",
    title: "AHIP & Carrier Certifications",
    description: "Completing AHIP certification and carrier-specific certification requirements.",
    duration: "1h 14min",
    vimeoId: "1153798354",
    vimeoHash: "db881a46a4",
    startTime: 0,
    module: "Day 13",
    moduleOrder: 13,
    videoOrder: 1,
  },
  {
    id: "14",
    title: "Marketing Updates & Cross-Selling",
    description: "Latest marketing strategies and cross-selling opportunities.",
    duration: "1h 12min",
    vimeoId: "1153796814",
    vimeoHash: "725adcdbcf",
    startTime: 0,
    module: "Day 14",
    moduleOrder: 14,
    videoOrder: 1,
  },
  {
    id: "15",
    title: "Sales Process & Client Intake",
    description: "Complete sales process from initial contact through client intake.",
    duration: "1h 51min",
    vimeoId: "1153797240",
    vimeoHash: "f4b5f02a68",
    startTime: 0,
    module: "Day 15",
    moduleOrder: 15,
    videoOrder: 1,
  },
  {
    id: "16",
    title: "AEP Launch Preparation",
    description: "Final preparation checklist for Annual Enrollment Period launch.",
    duration: "1h 3min",
    vimeoId: "1153797512",
    vimeoHash: "4ecf7d4423",
    startTime: 0,
    module: "Day 16",
    moduleOrder: 16,
    videoOrder: 1,
  }
];

export const getVideoById = (id: string) => trainingVideos.find(v => v.id === id);

export const getVideosByModule = () => {
  const modules: Record<string, TrainingVideo[]> = {};
  trainingVideos.forEach(video => {
    if (!modules[video.module]) {
      modules[video.module] = [];
    }
    modules[video.module].push(video);
  });
  return Object.entries(modules)
    .sort(([,a], [,b]) => a[0].moduleOrder - b[0].moduleOrder)
    .map(([moduleName, videos]) => ({
      moduleName,
      videos: videos.sort((a, b) => a.videoOrder - b.videoOrder)
    }));
};

export const getNextVideo = (currentId: string) => {
  const currentIndex = trainingVideos.findIndex(v => v.id === currentId);
  if (currentIndex === -1 || currentIndex === trainingVideos.length - 1) return null;
  return trainingVideos[currentIndex + 1];
};

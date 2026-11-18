/* ============================================================================
   DEFAULT CONTENT  —  what the site shows before you edit anything.
   ----------------------------------------------------------------------------
   The easiest way to change content is the ADMIN SCREEN at  /admin  (add, edit,
   reorder and delete everything, change themes). Your edits are saved in the
   storage adapter (src/data/store.js: this browser now, a database later) and
   they override the defaults in this file. You can still edit this file to
   change what a brand-new visitor / a reset site starts with.

   HOW PLACEHOLDERS WORK
   • Text in [square brackets]  = placeholder text. Replace it with your own.
   • Image paths                = files inside /public, or any https:// link
                                  (Google Drive share links work too). A missing
                                  file shows a labelled placeholder box.
   • Links left as ""           = hidden (or "coming soon") until you add them.
   • Anything with YOUR_        = replace with your real value.
   ========================================================================== */

/* ------------------------------ SITE-WIDE -------------------------------- */
export const site = {
  name: "S. Manohar",
  shortName: "Manohar",
  monogram: "SM",
  role: "Full-Stack & Mobile Developer",
  url: "https://manohar-portfolio-gray.vercel.app",
  resumeUrl: "/resume/Manohar_Resume.pdf", // ✎ replace the file in /public/resume/
  footerNote: "Designed and built by S. Manohar.",
};

export const socials = {
  github: "https://github.com/Manohar12095",
  linkedin: "https://www.linkedin.com/in/YOUR_LINKEDIN_ID", // ✎ placeholder
  instagram: "", // ✎ optional
  youtube: "", // ✎ optional
};

/* --------------------------------- HERO ---------------------------------- */
export const hero = {
  badge: "CSE student · Full-stack · Mobile · AI",
  titleLines: ["I build software", "with real depth."], // 2nd line gets the blue gradient
  intro:
    "I'm S. Manohar, a third-year Computer Science Engineering student in Madurai. I build full-stack web apps, Flutter and Kotlin mobile apps, and AI-powered tools.",
  photo: "/images/profile.jpg", // ✎ portrait photo, about 1200×1500 (4:5)
  video: "/videos/intro.webm", // ✎ plays inside the photo when visitors press ▶. mp4/webm link, YouTube or Google Drive link. Leave "" to hide the button.
  photoCaptionName: "S. Manohar",
  status: "[Open to internships & collaborations]", // ✎ edit or delete
  chips: ["Full-stack web", "Flutter & Kotlin", "AI tooling"],
  floatingTags: ["React", "Flutter", "Kotlin"], // small 3D badges floating on the photo card
};

/* --------------------------------- ABOUT --------------------------------- */
export const about = {
  heading: "A student who ships real apps.",
  photo: "/images/about.jpg", // ✎ a second, more casual photo (3:4)
  paragraphs: [
    "I'm a third-year Computer Science Engineering student at Kamaraj College of Engineering & Technology, Madurai, originally from Tirunelveli. I started coding in 2024 and have since built web apps with React and Vercel, mobile apps in Flutter and Kotlin, and tools that use AI agents.",
    "Outside of code I edit photos and videos, design brand identities, and fix computers, so I care about how a product looks as much as how it runs.",
    "[Add a short paragraph about what you want to do next: an internship, open-source work, a startup idea, or a topic you are exploring.]",
  ],
  facts: [
    { label: "Based in", value: "Madurai, Tamil Nadu (from Tirunelveli)" },
    { label: "Studying", value: "B.E. Computer Science Engineering, 3rd year" },
    { label: "College", value: "Kamaraj College of Engineering & Technology" },
    { label: "Languages", value: "Tamil, English" },
    { label: "Coding since", value: "2024" },
    { label: "Also into", value: "Brand design, AI image generation, Tamil cinema" },
  ],
  whatIDo: [
    {
      icon: "globe",
      title: "Full-stack web",
      text: "React front ends, SQL back ends, and deployments on Vercel.",
    },
    {
      icon: "smartphone",
      title: "Mobile apps",
      text: "Native Android in Kotlin and cross-platform apps in Flutter.",
    },
    {
      icon: "bot",
      title: "AI & automation",
      text: "Agentic workflows, local models with Ollama, and Python tooling.",
    },
    {
      icon: "palette",
      title: "Design & media",
      text: "Brand identity, product design, photo and video editing.",
    },
  ],
};

/* ---------------------------- MY JOURNEY (cards) -------------------------- */
/* Each card opens its own page at /journey/<slug>. Add as many as you like.
   Every item below the card shows up in the accordion on that page.        */
export const journey = {
  heading: "My journey",
  intro: "Camps, courses, contests and events that shaped how I build. Each card lists them newest first.",
  items: [
    {
      slug: "extra-curricular",
      title: "Extra-Curricular Activities",
      summary: "Dance, MC, tug of war, leadership programmes, yoga and more.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "1st Prize in Tug of War – Pongal Celebration",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Performed as Master of Ceremony (MOC) at NCC ATC Camp",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Performed a Mime Show at NCC ATC Camp",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Performed in the Independence Day Drill",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in the \"Cooking Without Fire\" Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in Library Carnival",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in English Elocution Competition – Tech-O-Fest",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in Twist and Tail Story Telling Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in Yoga Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Solo Dance",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Master of Ceremony (MOC)",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Part of the Record-Setting Event \"One History, One Thousand+ Voices about Kamaraj\"",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Tug of War – Pongal Celebration",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "80 kg Rock Lifting – Pongal Celebration",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Leadership Programme",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Leadership Programme – RYLA",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Participated in Team Guidance Event – RYLA",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Participated in MINE Programme",
          year: "2023",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "internship",
      title: "Internship",
      summary: "Panith Innovations and a Flutter internship at Gateway Solutions.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "Flutter Internship – Gateway Solutions, Madurai",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Panith Innovations – 15-Day Internship",
          year: "2025",
          meta: "",
          text: "Learned Git, Web Deployment and Machine Learning",
        },
      ],
    },
    {
      slug: "academy",
      title: "Academy",
      summary: "Python, Java, web design, value-added and NIELIT courses.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "Value-Added Course – Agentic AI",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Value-Added Course – Kotlin",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "NIELIT Online Course – Computer Concepts",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "NIELIT Online Course – Cyber Security",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "NIELIT Online Course – Web Design and Publishing (O Grade)",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Python Programming Fundamentals – Infosys",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Python Basics",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Programming Using Java",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Distinction in Web Design – CSUITS",
          year: "2020",
          meta: "",
          text: "",
        },
        {
          title: "Distinction in Programming Techniques – CSUITS",
          year: "2019",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "workshops",
      title: "Workshops",
      summary: "IIT Chennai, GitHub, blockchain and Python & NLP workshops.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "GitHub Workshop",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Python and NLP Workshop – Ethiqan Technology, Kerala",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "IIT Chennai – Data Science",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "IIT Chennai – Artificial Intelligence",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Blockchain Technology",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Web Creation Workshop",
          year: "2025",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "ncc",
      title: "NCC",
      summary: "Camps, the B certificate, a drill competition win and rifle firing.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "NCC \"B\" Certificate – \"A\" Grade",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "NCC Annual Training Camp",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "CATC cum RDC Training 3 Camp",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "CATC cum RDC – IGC Launch Camp",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in NCC Drill Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Fired 312 live rounds with a .22 sporting rifle",
          year: "2026",
          meta: "2025–2026",
          text: "",
        },
        {
          title: "NCC – IGC RDC Camp",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "NCC – RDC Launch Camp",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "IUC RDC Camp",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "RDC Training 1 Camp",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "ATC Camp, Virudhunagar",
          year: "2025",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "sports",
      title: "Sports",
      summary: "Marathons, relays, running races, skating and handball.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "2nd Prize in 5 km Running Race",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in 4×400 m Relay",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in 400 m Running Race",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in 4×100 m Relay",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in 1500 m Running Race",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in 1500 m NCC Running Race",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "10 km Sattur Marathon – completed in 59 minutes",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "6 km Virudhunagar Marathon – participated",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "14 km Virudhunagar Marathon – completed in 1 hr 18 min, won a Silver Coin",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "14th Place – Sattur Marathon",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Kho-Kho – Inter-SBOA Competition",
          year: "2023",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in 4×100 m Relay",
          year: "2023",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Skating",
          year: "2020",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Skating",
          year: "2019",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in Handball",
          year: "2018",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "social-activities",
      title: "Social Activities",
      summary: "Anti-ragging club, pledges, crowd-control duty and NCC volunteering.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "Assisted Kaadai Muttai Company with a Land Survey",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Republic Day NCC Drill Performance",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Crowd Control Duty – Virudhunagar",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Yoga Day – NCC Volunteering Work",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Nasha Mukt Yoga for Viksit Bharat – Online Pledge",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Organised the Anti-Ragging Programme and Conducted Events",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Took the Swachhata Hi Seva Pledge",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Set up a Stall at the Tech-O-Fest Event, KCET",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Active Anti-Ragging Club Member",
          year: "2025",
          meta: "Since 2025",
          text: "",
        },
        {
          title: "Pledge Against Drug Abuse",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Achiever of the Year",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Spoke on Anti-Ragging Awareness",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Temple Traffic and Crowd Control Duty – Virudhunagar",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Republic Day NCC Drill",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Independence Day NCC Performance",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Master of Ceremony (MOC) – Anti-Ragging Event",
          year: "2025",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "projects",
      title: "Projects",
      summary: "Hackathons, ML projects, my first app and the sites I built.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "30+ Machine Learning Projects",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Designed the Human Trust Fact Checker Website",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Built the Daily Activity Tracker Website",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Built the Interactive AI Assistant Application",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Won Smart India Hackathon at College Level",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Video Editing",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Participated in Smart India Hackathon",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Participated in a National-Level Hackathon",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "1st Prize in Entrepreneurship – IIT Bombay",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Created My First App – Won 1st Prize",
          year: "2023",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "technical-activities",
      title: "Technical Activities",
      summary: "Symposiums, hackathons, photography and an international conference.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "Symposium – Kalasalingam University",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Symposium – SBM College",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "3rd Prize in Photography Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in a 32-Hour Offline Hackathon – Ramco College, Rajapalayam",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in a 32-Hour Online + 6-Hour Offline Hackathon – SRM College, Tiruchirappalli",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "2nd Prize in Idea Presentation – International Conference, Marthandam",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Participated in the AI-Driven Book Cover Design Competition",
          year: "2026",
          meta: "",
          text: "",
        },
        {
          title: "Symposium – Thiagarajar College",
          year: "2025",
          meta: "",
          text: "",
        },
        {
          title: "Symposium – NPR College",
          year: "2025",
          meta: "",
          text: "",
        },
      ],
    },
    {
      slug: "startup",
      title: "Startup Entrepreneurship",
      summary: "IN NET CREATIONS: websites, editing, promotion and accounts.",
      cover: "",
      intro: "",
      gallery: [],
      entries: [
        {
          title: "Founder of IN NET CREATIONS",
          year: "",
          meta: "",
          text: "Website Development · Video/Photo Editing · Product Promotion · Account Management",
        },
      ],
    },
  ],
};

/* ------------------------------- EXPERIENCE ------------------------------ */
/* type: "work" | "learning" | "education"  (changes the icon)               */
export const experience = {
  heading: "Experience & education",
  intro: "Where I have worked and learned, newest first.",
  items: [
    {
      type: "work",
      role: "Flutter Intern",
      org: "Gateway Solutions, Madurai",
      date: "[Month Year – Month Year]",
      text: "[One or two lines on the app or features you worked on.]",
      bullets: [
        "[Feature or screen you built]",
        "[Tool, API or package you used]",
        "[Result, such as a release or a number]",
      ],
      tags: ["Flutter", "Dart", "REST APIs"],
    },
    {
      type: "learning",
      role: "Agentic AI course project",
      org: "Value-added course",
      date: "[Year]",
      text: "[One or two lines on the project you built in the course.]",
      bullets: ["[What the agent does]", "[Stack and tools used]"],
      tags: ["Agentic AI", "Python"],
    },
    {
      type: "learning",
      role: "Kotlin value-added course",
      org: "[Provider]",
      date: "[Year]",
      text: "[One or two lines on what you learned and built.]",
      bullets: [],
      tags: ["Kotlin", "Android Studio"],
    },
    {
      type: "learning",
      role: "NIELIT courses",
      org: "NIELIT",
      date: "[Year]",
      text: "[Names of the courses you completed.]",
      bullets: [],
      tags: ["[Course]", "[Course]"],
    },
    {
      type: "education",
      role: "B.E. Computer Science Engineering",
      org: "Kamaraj College of Engineering & Technology, Madurai",
      date: "2024 – Present",
      text: "Currently in the third year. [Add CGPA, favourite subjects or clubs if you want.]",
      bullets: [],
      tags: ["CSE"],
    },
  ],
};

/* -------------------------------- PROJECTS ------------------------------- */
/* status: "live" | "complete" | "in-progress"
   category: "Web" | "Mobile" | "Desktop" | "AI & IoT"  (used by the filter chips)
   links: leave "" to hide the button.
   You have 21 projects: copy a block, paste it, and fill it in.             */
export const projects = {
  heading: "Projects",
  intro: "Apps, tools and experiments I have built.",
  initiallyVisible: 6,
  items: [
    {
      slug: "in-net-web-seeker",
      title: "In Net Web Seeker",
      description: "Secure web crawler with DNS, RDAP, TLS, security-header and technology checks, plus a verifiable ZIP export. Built as my Computer Networks mini project.",
      category: "Security",
      status: "live",
      tags: ["DNS", "RDAP", "TLS", "ZIP export"],
      cover: "",
      links: {
        live: "https://in-net-web-seeker.vercel.app/",
        github: "https://github.com/Manohar12095/In-Net-Web-Seeker",
      },
    },
    {
      slug: "aquasentinel-ai",
      title: "AquaSentinel-AI",
      description: "AI-based prediction app hosted on Streamlit.",
      category: "AI",
      status: "live",
      tags: ["AI", "Streamlit"],
      cover: "",
      links: {
        live: "https://air-prediction-9fgbrchtwu2k8dqox3v8dg.streamlit.app/",
        github: "https://github.com/Manohar12095/AquaSentinel-AI",
      },
    },
    {
      slug: "ctrl-cell-tyrosinase-inhibitor-discovery-platform",
      title: "CTRL-CELL Tyrosinase Inhibitor Discovery Platform",
      description: "Drug-discovery web platform for tyrosinase inhibitors, with a Round 1 screening workflow.",
      category: "AI",
      status: "live",
      tags: ["Drug discovery", "Screening"],
      cover: "",
      links: {
        live: "https://ctrl-cell-tyrosinase-inhibitor-disc.vercel.app/round1",
        github: "https://github.com/Manohar12095/CTRL-CELL-Tyrosinase-Inhibitor-Discovery-Platform",
      },
    },
    {
      slug: "tyrosinase-ppo-inhibitor-discovery",
      title: "Tyrosinase PPO Inhibitor Discovery",
      description: "Related inhibitor-discovery project for tyrosinase and PPO.",
      category: "AI",
      status: "live",
      tags: ["Drug discovery", "Tyrosinase"],
      cover: "",
      links: {
        live: "https://tyrosinase-ppo-inhibitor-discovery.vercel.app/",
        github: "https://github.com/Manohar12095/Tyrosinase-PPO-Inhibitor-Discovery",
      },
    },
    {
      slug: "in-net-stt-convertor",
      title: "IN NET STT Convertor",
      description: "Speech-to-text converter web app.",
      category: "Tools",
      status: "live",
      tags: ["Speech-to-text"],
      cover: "",
      links: {
        live: "https://in-net-stt-convertor.vercel.app/",
        github: "https://github.com/Manohar12095/IN-NET-STT-Convertor",
      },
    },
    {
      slug: "in-net-calendar",
      title: "IN NET Calendar",
      description: "AI-connected calendar and task-planning app.",
      category: "Web",
      status: "in-progress",
      tags: ["AI", "Calendar", "Tasks"],
      cover: "",
      links: {
        live: "",
        github: "https://github.com/Manohar12095/IN-NET-Calendar",
      },
    },
    {
      slug: "cat-music-player",
      title: "CAT Music Player",
      description: "Music streaming and creator platform.",
      category: "Web",
      status: "in-progress",
      tags: ["Streaming", "Creator platform"],
      cover: "",
      links: {
        live: "",
        github: "https://github.com/Manohar12095/CAT-MUSIC-PLAYER",
      },
    },
    {
      slug: "dns-shield",
      title: "DNS Shield",
      description: "DNS protection and security tool with a web front end.",
      category: "Security",
      status: "live",
      tags: ["DNS", "Security"],
      cover: "",
      links: {
        live: "https://dns-shield-frontend.vercel.app/",
        github: "https://github.com/Manohar12095/DNS-Shield",
      },
    },
    {
      slug: "student-automation-system-sih-2026",
      title: "Student Automation System (SIH 2026)",
      description: "Smart India Hackathon 2026 project that automates student-related tasks.",
      category: "Web",
      status: "live",
      tags: ["Smart India Hackathon", "Automation"],
      cover: "",
      links: {
        live: "https://student-automation-system-sih-2026.vercel.app/",
        github: "https://github.com/Manohar12095/STUDENT-AUTOMATION-SYSTEM---SIH-2026",
      },
    },
    {
      slug: "kotlin-moving-contents-between-activities",
      title: "Kotlin: Moving Contents Between Activities",
      description: "Android (Kotlin) practice app that passes data from one activity to another.",
      category: "Mobile",
      status: "complete",
      tags: ["Kotlin", "Android"],
      cover: "",
      links: {
        live: "",
        github: "https://github.com/Manohar12095/Moving-Contents-from-one-activity-to-another-KOTLIN-",
      },
    },
    {
      slug: "kotlin-quiz-vac",
      title: "Kotlin: Quiz (VAC)",
      description: "Android (Kotlin) quiz app built during the Kotlin Value-Added Course.",
      category: "Mobile",
      status: "complete",
      tags: ["Kotlin", "Android", "Quiz"],
      cover: "",
      links: {
        live: "",
        github: "https://github.com/Manohar12095/Quiz-Kotlin-VAC",
      },
    },
    {
      slug: "trust-analyser-trustmenot",
      title: "Trust Analyser (TrustMeNot)",
      description: "Interactive quiz web app.",
      category: "Web",
      status: "live",
      tags: ["Quiz"],
      cover: "",
      links: {
        live: "https://trust-analyser.vercel.app/",
        github: "https://github.com/Manohar12095/Trust-_Analyser",
      },
    },
    {
      slug: "qr-cracker",
      title: "QR Cracker",
      description: "QR code and cipher toolkit.",
      category: "Tools",
      status: "live",
      tags: ["QR", "Ciphers"],
      cover: "",
      links: {
        live: "https://qr-cracker.vercel.app/",
        github: "https://github.com/Manohar12095/QR-Cracker",
      },
    },
    {
      slug: "kart-zone",
      title: "Kart Zone",
      description: "AI-powered multi-vendor e-commerce marketplace.",
      category: "Web",
      status: "live",
      tags: ["E-commerce", "AI", "Multi-vendor"],
      cover: "",
      links: {
        live: "https://kartzone-two.vercel.app/",
        github: "https://github.com/Manohar12095/Kart_Zone-Shopping-",
      },
    },
    {
      slug: "mdds-multi-disease-diagnostic-portal",
      title: "MDDS – Multi-Disease Diagnostic Portal",
      description: "Multi-disease diagnostic portal.",
      category: "AI",
      status: "live",
      tags: ["Healthcare", "Diagnostics"],
      cover: "",
      links: {
        live: "https://mdds-new-rnrp.vercel.app/",
        github: "https://github.com/Manohar12095/MDDS_NEW",
      },
    },
    {
      slug: "calculator",
      title: "Calculator",
      description: "Calculator web app.",
      category: "Tools",
      status: "live",
      tags: ["Calculator"],
      cover: "",
      links: {
        live: "https://calculator-navy-three-30.vercel.app/",
        github: "https://github.com/Manohar12095/Calculator",
      },
    },
    {
      slug: "crack-code",
      title: "Crack Code",
      description: "Encoding and decoding platform.",
      category: "Tools",
      status: "live",
      tags: ["Encoding", "Decoding"],
      cover: "",
      links: {
        live: "https://crack-code-nn1t.vercel.app/",
        github: "https://github.com/Manohar12095/Crack-code",
      },
    },
    {
      slug: "manohar-portfolio",
      title: "Manohar Portfolio",
      description: "My personal portfolio website (this site).",
      category: "Web",
      status: "live",
      tags: ["Portfolio"],
      cover: "",
      links: {
        live: "https://manohar-portfolio-gray.vercel.app/",
        github: "https://github.com/Manohar12095/Manohar_Portfolio",
      },
    },
    {
      slug: "in-net-ai-assist-formerly-rahonam",
      title: "IN NET AI Assist (formerly RAHONAM)",
      description: "AI chatbox with a React + Vite front end and a FastAPI + LangChain back end. It is the root of the IN NET ecosystem and is being upgraded with multi-LLM support, voice and tool routing to my other sites.",
      category: "AI",
      status: "in-progress",
      tags: ["React", "Vite", "FastAPI", "LangChain"],
      cover: "",
      links: {
        live: "",
        github: "https://github.com/Manohar12095/Interative_AI_Chatbox",
      },
    },
    {
      slug: "sri-suriya-pipes-website",
      title: "Sri Suriya Pipes Website",
      description: "Client website for a PVC pipe manufacturer in Madurai, currently being redesigned.",
      category: "Web",
      status: "live",
      tags: ["Client work", "Redesign"],
      cover: "",
      links: {
        live: "http://suriyapipe.com/",
        github: "https://github.com/Manohar12095/Sri-Suriya-Pvc-Pipes",
      },
    },
    {
      slug: "in-net-creations-website",
      title: "IN NET CREATIONS Website",
      description: "Official website of my studio, IN NET Creations.",
      category: "Web",
      status: "live",
      tags: ["Studio site"],
      cover: "",
      links: {
        live: "https://in-net-creations.vercel.app/",
        github: "https://github.com/Manohar12095/Business_In-Net-Creation",
      },
    },
  ],
};

/* --------------------------------- SKILLS -------------------------------- */
/* Every skill appears in the 3D sphere. `group` sets its colour & the list.  */
export const skillGroups = [
  {
    id: "languages",
    label: "Languages",
    color: "#2158e8",
    items: ["C", "C++", "Java", "Python", "JavaScript", "Kotlin", "PHP", "SQL", "HTML"],
  },
  {
    id: "build",
    label: "Web & mobile",
    color: "#0aa5d6",
    items: ["React", "Flutter", "Android", "Vercel", "Supabase", "Docker"],
  },
  {
    id: "ai",
    label: "AI & tooling",
    color: "#7a4dff",
    items: ["AI/ML", "Hugging Face", "Colab", "Ollama", "Claude Code", "Antigravity", "Git", "GitHub"],
  },
  {
    id: "systems",
    label: "Systems",
    color: "#0f8f6b",
    items: ["Windows", "Ubuntu", "Arch Linux", "Kali Linux", "Debian", "Linux Mint"],
  },
  {
    id: "creative",
    label: "Creative",
    color: "#e0561f",
    items: ["Photo editing", "Video editing", "Product design", "Brand identity", "AI image generation"],
  },
];

export const skills = {
  heading: "Skills",
  intro: "Drag the sphere to spin it. The lists on the right group everything by area.",
};

/* ------------------------ ACHIEVEMENTS + REEL CAROUSEL ------------------- */
export const achievements = {
  heading: "Achievements",
  intro: "Wins, prizes and moments worth replaying.",
  /* The reel carousel. Put video files in /public/videos and posters in
     /public/images/reels. If a video is missing, the poster/placeholder shows. */
  reels: [
    {
      title: "NCC drill competition win",
      video: "/videos/reel-ncc-drill.mp4",
      poster: "/images/reels/ncc-drill.jpg",
    },
    {
      title: "ICHE-2026 idea presentation",
      video: "/videos/reel-iche.mp4",
      poster: "/images/reels/iche.jpg",
    },
    {
      title: "[Hackathon highlights]",
      video: "/videos/reel-hackathon.mp4",
      poster: "/images/reels/hackathon.jpg",
    },
    {
      title: "[Marathon finish]",
      video: "/videos/reel-marathon.mp4",
      poster: "/images/reels/marathon.jpg",
    },
    {
      title: "[Internship moments]",
      video: "/videos/reel-internship.mp4",
      poster: "/images/reels/internship.jpg",
    },
  ],
  /* icon: "trophy" | "medal" | "award" | "star"                              */
  list: [
    {
      icon: "trophy",
      title: "2nd prize, ICHE-2026 Idea Presentation",
      meta: "Udaya School of Engineering, Marthandam · Oct 2026",
      text: "Presented Lively Water Quality (NeerGuard).",
    },
    {
      icon: "medal",
      title: "Drill competition winner, NCC",
      meta: "[Competition · Year]",
      text: "[One line about the event and your team.]",
    },
    {
      icon: "award",
      title: "IIT Bombay entrepreneurship competition",
      meta: "[Round / result · Year]",
      text: "[One line about your idea.]",
    },
    {
      icon: "star",
      title: "[Hackathon achievement]",
      meta: "[Event · Year]",
      text: "[One line about what you built.]",
    },
    {
      icon: "medal",
      title: "[Marathon finisher]",
      meta: "[Event · Distance · Year]",
      text: "[One line about your run.]",
    },
    {
      icon: "award",
      title: "[Another certificate or award]",
      meta: "[Issuer · Year]",
      text: "[One line.]",
    },
  ],
};

/* --------------------------------- CONTACT ------------------------------- */
export const contact = {
  heading: "Let's talk",
  intro:
    "Have a project, an internship or a collaboration in mind? Send a message and I will reply as soon as I can.",
  email: "YOUR_EMAIL@example.com", // ✎ replace
  location: "Madurai, Tamil Nadu, India",
  /* Optional: paste a Formspree / Web3Forms endpoint so the form sends without
     opening the visitor's email app. Leave "" to use a mailto: link instead.
     Example: "https://formspree.io/f/abcdwxyz"                              */
  formEndpoint: "",
};

/* ------------------------- SECTION ORDER & VISIBILITY --------------------- */
/* Reorder / hide sections in Admin → Sections. "home" always stays first.   */
export const sections = [
  { id: "home", label: "Home", visible: true },
  { id: "about", label: "About", visible: true },
  { id: "journey", label: "Journey", visible: true },
  { id: "experience", label: "Experience", visible: true },
  { id: "projects", label: "Projects", visible: true },
  { id: "skills", label: "Skills", visible: true },
  { id: "achievements", label: "Achievements", visible: true },
  { id: "contact", label: "Contact", visible: true },
];

/* ------------------------------ BROWSER TAB / SEO ------------------------- */
export const settings = {
  seoTitle: "S. Manohar — Full-Stack & Mobile Developer",
  seoDescription:
    "S. Manohar is a computer science engineering student from Madurai who builds full-stack web apps, Flutter and Kotlin mobile apps, and AI-powered tools.",
};

/** Everything above in one object. This is the shape that gets saved. */
export const defaultContent = {
  site,
  socials,
  hero,
  about,
  journey,
  experience,
  projects,
  skillGroups,
  skills,
  achievements,
  contact,
  sections,
  settings,
};

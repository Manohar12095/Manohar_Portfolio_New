/* ============================================================================
   ADMIN SCREENS, DESCRIBED AS DATA
   Each tab is a list of "blocks". A block edits one part of the content:
     { title, path, fields }   edits an object (path = where it lives in the content)
     { title, path, list }     edits a list of objects (add / edit / reorder / delete)
   To add a new editable field to the site: add it to src/data/content.js, then add
   one line here.
   ========================================================================== */
import { uid } from "../lib/shape";
import { ABOUT_ICONS } from "../components/About";
import { ACH_ICONS } from "../components/Achievements";

const text = (key, label, extra = {}) => ({ key, label, type: "text", ...extra });
const area = (key, label, extra = {}) => ({ key, label, type: "textarea", ...extra });
const url = (key, label, extra = {}) => ({ key, label, type: "url", ...extra });
const image = (key, label, extra = {}) => ({ key, label, type: "image", ...extra });
const video = (key, label, extra = {}) => ({ key, label, type: "video", ...extra });
const strings = (key, label, extra = {}) => ({ key, label, type: "strings", ...extra });

const sectionText = [text("heading", "Heading"), area("intro", "Short intro under the heading", { rows: 2 })];

export const TABS = [
  {
    id: "general",
    label: "General",
    icon: "settings",
    blurb: "Your name, links, and what shows in the browser tab and search results.",
    blocks: [
      {
        title: "Site",
        path: ["site"],
        fields: [
          text("name", "Full name", { help: "Shown in the footer and used for accessibility labels." }),
          text("shortName", "Short name", { help: "Shown next to the logo, for example “Manohar”." }),
          text("monogram", "Logo letters", { help: "Two or three letters inside the logo square." }),
          text("role", "Role"),
          url("url", "Site address"),
          url("resumeUrl", "Resume file or link", { help: "A PDF path such as /resume/Manohar_Resume.pdf, or a link to the file." }),
          text("footerNote", "Footer note"),
        ],
      },
      {
        title: "Social links",
        path: ["socials"],
        fields: [
          url("whatsapp", "WhatsApp (chat link)", { help: "e.g. https://wa.me/916369036210" }),
          url("linkedin", "LinkedIn"),
          url("github", "GitHub"),
          url("instagram", "Instagram", { help: "Leave empty to hide the icon." }),
          url("youtube", "YouTube", { help: "Leave empty to hide the icon." }),
        ],
      },
      {
        title: "Browser tab and search results",
        path: ["settings"],
        fields: [
          text("seoTitle", "Page title", { help: "Shown on the browser tab and in Google." }),
          area("seoDescription", "Page description", { rows: 3, help: "About 150 characters works best." }),
        ],
      },
    ],
  },
  { id: "sections", label: "Sections", icon: "layout", blurb: "Choose which sections appear, their order, and their menu names.", custom: "sections" },
  {
    id: "hero",
    label: "Hero",
    icon: "sparkles",
    blurb: "The first screen: headline, photo, and the intro video behind the ▶ button.",
    blocks: [
      {
        title: "Hero",
        path: ["hero"],
        fields: [
          text("badge", "Badge above the headline"),
          strings("titleLines", "Headline lines", { help: "Use two lines. The second line gets the colour gradient.", addLabel: "Add line" }),
          area("intro", "Intro paragraph", { rows: 3 }),
          image("photo", "Portrait photo", { help: "4:5 portrait, about 1200×1500. Google Drive links work." }),
          video("video", "Intro video (play button)", {
            help: "Plays inside the photo when a visitor presses ▶, then the photo comes back. Leave empty to hide the button.",
          }),
          text("photoCaptionName", "Name on the photo card"),
          text("status", "Status line on the photo card"),
          strings("chips", "Skill chips under the buttons", { addLabel: "Add chip" }),
          strings("floatingTags", "Floating tags on the photo", { help: "Up to three are shown.", addLabel: "Add tag" }),
        ],
      },
    ],
  },
  {
    id: "about",
    label: "About",
    icon: "user",
    blurb: "Your story, quick facts, and what you do.",
    blocks: [
      {
        title: "About",
        path: ["about"],
        fields: [
          text("heading", "Heading"),
          image("photo", "Photo", { help: "3:4 portrait. Google Drive links work." }),
          strings("paragraphs", "Paragraphs", { itemType: "textarea", addLabel: "Add paragraph" }),
        ],
      },
      {
        title: "Quick facts",
        path: ["about", "facts"],
        list: {
          label: "Facts",
          addLabel: "Add fact",
          itemTitle: (i) => i.label,
          itemMeta: (i) => i.value,
          newItem: () => ({ label: "New fact", value: "" }),
          fields: [text("label", "Label"), text("value", "Value")],
        },
      },
      {
        title: "What I do",
        path: ["about", "whatIDo"],
        list: {
          label: "Cards",
          addLabel: "Add card",
          itemTitle: (i) => i.title,
          newItem: () => ({ icon: "code", title: "New skill area", text: "" }),
          fields: [
            { key: "icon", label: "Icon", type: "select", options: Object.keys(ABOUT_ICONS) },
            text("title", "Title"),
            area("text", "Text", { rows: 2 }),
          ],
        },
      },
    ],
  },
  {
    id: "journey",
    label: "Journey",
    icon: "route",
    blurb: "The card grid. Each card opens its own page with a photo gallery and an expandable list.",
    blocks: [
      { title: "Section text", path: ["journey"], fields: sectionText },
      {
        title: "Journey cards",
        path: ["journey", "items"],
        list: {
          label: "Cards",
          addLabel: "Add journey card",
          itemTitle: (i) => i.title,
          itemMeta: (i) => `/journey/${i.slug}`,
          newItem: () => ({ slug: `journey-${uid()}`, title: "New journey card", summary: "", cover: "", intro: "", gallery: [], entries: [] }),
          fields: [
            text("title", "Title"),
            { key: "slug", label: "Page address (slug)", type: "slug", help: "The page opens at /journey/<slug>. Must be unique." },
            text("summary", "One-line summary on the card"),
            image("cover", "Cover photo", { help: "Shown on the card and as the first photo on its page." }),
            area("intro", "Intro on the page", { rows: 2 }),
            strings("gallery", "More photos", { itemType: "image", itemLabel: "Photo", addLabel: "Add photo" }),
            {
              key: "entries",
              label: "Expandable list on the page",
              type: "objects",
              addLabel: "Add entry",
              itemTitle: (e) => e.title,
              itemMeta: (e) => [e.year, e.meta].filter(Boolean).join(" · "),
              newItem: () => ({ title: "New entry", year: String(new Date().getFullYear()), meta: "", text: "" }),
              fields: [
                text("title", "Title"),
                text("year", "Year", { help: "Four digits, for example 2026. The page groups entries by year, newest first." }),
                text("meta", "Small line on the right (optional)", { help: "For example 2025–2026 or a place." }),
                area("text", "Details (optional)", { rows: 3, help: "Leave empty for a simple one-line row. Add text to make it expandable." }),
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    icon: "briefcase",
    blurb: "The timeline of jobs, courses and education.",
    blocks: [
      { title: "Section text", path: ["experience"], fields: sectionText },
      {
        title: "Timeline items",
        path: ["experience", "items"],
        list: {
          label: "Items (newest first)",
          addLabel: "Add timeline item",
          itemTitle: (i) => i.role,
          itemMeta: (i) => i.org,
          newItem: () => ({ type: "work", role: "New role", org: "", date: "", text: "", bullets: [], tags: [] }),
          fields: [
            { key: "type", label: "Type", type: "select", options: [{ value: "work", label: "Work / internship" }, { value: "learning", label: "Course / learning" }, { value: "education", label: "Education" }] },
            text("role", "Role or title"),
            text("org", "Organisation"),
            text("date", "Dates"),
            area("text", "Description", { rows: 3 }),
            strings("bullets", "Bullet points", { addLabel: "Add bullet" }),
            strings("tags", "Tags", { addLabel: "Add tag" }),
          ],
        },
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "folder",
    blurb: "Your project cards. Leave a link empty to hide its button.",
    blocks: [
      {
        title: "Section text",
        path: ["projects"],
        fields: [...sectionText, { key: "initiallyVisible", label: "Projects shown before “Show more”", type: "number", min: 1, max: 60, step: 1 }],
      },
      {
        title: "Projects",
        path: ["projects", "items"],
        list: {
          label: "Projects",
          addLabel: "Add project",
          itemTitle: (i) => i.title,
          itemMeta: (i) => `${i.category || "No category"} · ${i.status}`,
          newItem: () => ({ slug: `project-${uid()}`, title: "New project", description: "", category: "Web", status: "in-progress", tags: [], cover: "", links: { live: "", github: "" } }),
          fields: [
            text("title", "Title"),
            { key: "slug", label: "Internal id (slug)", type: "slug", help: "Must be unique. Not shown to visitors." },
            area("description", "Description", { rows: 3 }),
            text("category", "Category", { suggestions: ["Web", "Mobile", "AI", "Security", "Tools", "Desktop"], help: "Becomes a filter button. Projects with the same category are grouped." }),
            { key: "status", label: "Status", type: "select", options: [{ value: "live", label: "Live" }, { value: "complete", label: "Complete" }, { value: "in-progress", label: "In progress" }] },
            strings("tags", "Tech tags", { addLabel: "Add tag" }),
            {
              key: "previewType",
              label: "Card Preview Style",
              type: "select",
              options: [
                { value: "auto", label: "Auto (Live website if available, GitHub card, or image)" },
                { value: "live", label: "Live Website Preview" },
                { value: "github", label: "Live GitHub Repository Card" },
                { value: "image", label: "Static Cover Image" },
              ],
              help: "Choose whether this card shows a live website preview, a live GitHub repo card, or your static image.",
            },
            image("cover", "Cover image (used if static image is selected or as fallback)", { help: "16:10. Google Drive links work." }),
            { key: "links", label: "Links", type: "group", fields: [url("live", "Live site"), url("github", "Code (GitHub)")] },
          ],
        },
      },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    icon: "cpu",
    blurb: "Every skill appears in the 3D sphere. Groups set the colour and the lists beside it.",
    blocks: [
      { title: "Section text", path: ["skills"], fields: [text("heading", "Heading"), area("intro", "Short intro", { rows: 2 })] },
      {
        title: "Skill groups",
        path: ["skillGroups"],
        list: {
          label: "Groups",
          addLabel: "Add group",
          itemTitle: (i) => i.label,
          itemMeta: (i) => `${(i.items || []).length} skills`,
          newItem: () => ({ id: `group-${uid()}`, label: "New group", color: "#2158e8", items: [] }),
          fields: [
            text("label", "Group name"),
            { key: "id", label: "Internal id", type: "slug" },
            { key: "color", label: "Dot colour", type: "color" },
            strings("items", "Skills", { addLabel: "Add skill" }),
          ],
        },
      },
    ],
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: "trophy",
    blurb: "The 3D reels carousel (photos & videos) and the achievements list.",
    blocks: [
      { title: "Section text", path: ["achievements"], fields: sectionText },
      {
        title: "Reels (carousel)",
        path: ["achievements", "reels"],
        list: {
          label: "Reels",
          addLabel: "Add reel / slide",
          itemTitle: (i) => i.title,
          newItem: () => ({ title: "New reel", mediaType: "auto", video: "", poster: "" }),
          fields: [
            text("title", "Title"),
            {
              key: "mediaType",
              label: "Media Type",
              type: "select",
              options: [
                { value: "auto", label: "Auto (Detect from image / video)" },
                { value: "image", label: "Picture / Photo / Certificate" },
                { value: "video", label: "Video Reel (.mp4, YouTube, Drive)" },
              ],
              help: "Choose whether this reel is a photo/certificate or a looping video.",
            },
            image("poster", "Picture / Poster image", { help: "Your photo, certificate, or video poster. Google Drive links work." }),
            video("video", "Video URL (optional for pictures)", { help: "Plays (muted, looping) when in the centre. Leave empty if this is a photo." }),
          ],
        },
      },
      {
        title: "Achievements list",
        path: ["achievements", "list"],
        list: {
          label: "Achievements",
          addLabel: "Add achievement",
          itemTitle: (i) => i.title,
          itemMeta: (i) => i.meta,
          newItem: () => ({ icon: "trophy", title: "New achievement", meta: "", text: "", image: "" }),
          fields: [
            { key: "icon", label: "Icon", type: "select", options: Object.keys(ACH_ICONS) },
            text("title", "Title"),
            text("meta", "Small line (event, year)"),
            area("text", "One-line description", { rows: 2 }),
            image("image", "Certificate / Photo image (optional)", { help: "Optional certificate or photo for this achievement." }),
          ],
        },
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    icon: "mail",
    blurb: "Where messages go and contact channels.",
    blocks: [
      {
        title: "Contact channels & settings",
        path: ["contact"],
        fields: [
          text("heading", "Heading"),
          area("intro", "Intro", { rows: 3 }),
          text("email", "Primary Email (Gmail)", { help: "Shown on the site and receives contact messages. e.g. manoharorignal@gmail.com" }),
          text("secondaryEmail", "Secondary Email (Outlook)", { help: "Alternative direct email. e.g. manoharorignal@outlook.com" }),
          text("whatsapp", "WhatsApp Display Number", { help: "e.g. +91 6369036210 or 6369036210" }),
          url("whatsappLink", "WhatsApp Chat Link", { help: "Direct link to start WhatsApp chat, e.g. https://wa.me/916369036210" }),
          text("location", "Location", { help: "e.g. Madurai, Tamil Nadu, India" }),
          url("formEndpoint", "Form Submission Endpoint", {
            help: "AJAX endpoint that receives contact form messages. By default: https://formsubmit.co/ajax/manoharorignal@gmail.com. Can also be Web3Forms or Formspree.",
          }),
        ],
      },
    ],
  },
  { id: "media", label: "Media", icon: "image", blurb: "Connect the Google Drive folder, upload photos and videos, and use them on your pages.", custom: "media" },
  { id: "themes", label: "Themes", icon: "palette", blurb: "Switch the look of the whole site, or build your own theme.", custom: "themes" },
  { id: "monitoring", label: "Monitoring & SEO", icon: "activity", blurb: "Live visitor telemetry, device stats, database health, and search engine audits.", custom: "monitoring" },
  { id: "data", label: "Data & security", icon: "database", blurb: "Back up, restore, reset, and protect the admin.", custom: "data" },
];

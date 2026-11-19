import { useState } from "react";
import {
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Send,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useContent } from "../context/ContentContext";
import { cleanLink, isPlaceholder } from "../lib/url";
import { getAdapter } from "../data/store";

function WhatsAppIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.82 11.82 0 00-3.475-8.404z" />
    </svg>
  );
}

export default function Contact() {
  const {
    content: { contact, socials },
  } = useContent();
  const [status, setStatus] = useState({ state: "idle", msg: "" });
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const primaryEmail =
    contact.email && !isPlaceholder(contact.email) && /^[^\s@]+@[^\s@]+$/.test(contact.email)
      ? contact.email
      : "manoharorignal@gmail.com";

  const secondaryEmail =
    contact.secondaryEmail && !isPlaceholder(contact.secondaryEmail)
      ? contact.secondaryEmail
      : "manoharorignal@outlook.com";

  const whatsappNum = contact.whatsapp || "6369036210";
  const whatsappLink =
    contact.whatsappLink || socials.whatsapp || `https://wa.me/91${whatsappNum.replace(/\D/g, "")}`;

  const linkedinUrl =
    cleanLink(socials.linkedin) || "https://www.linkedin.com/in/manohar-sudhakar-916a69353/";
  const githubUrl = cleanLink(socials.github) || "https://github.com/Manohar12095";

  const endpoint =
    cleanLink(contact.formEndpoint).startsWith("https://")
      ? cleanLink(contact.formEndpoint)
      : "https://formsubmit.co/ajax/manoharorignal@gmail.com";

  const onSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    if (form.get("website")) return; // honeypot
    const name = String(form.get("name") || "").trim();
    const from = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !from || !message) {
      setStatus({ state: "error", msg: "Please fill in your name, email and message." });
      return;
    }

    setStatus({ state: "sending", msg: "Sending message…" });

    // 1. Dual logging to Supabase
    try {
      const adapter = getAdapter();
      const supabase = adapter?.supabase;
      if (supabase) {
        await supabase.from("contact_messages").insert([{ name, email: from, message }]);
      }
    } catch (err) {
      console.warn("Could not log to Supabase contact_messages:", err);
    }

    // 2. Email delivery via FormSubmit or configured endpoint
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            email: from,
            message,
            _subject: `New portfolio inquiry from ${name}`,
          }),
        });

        if (!res.ok) throw new Error("bad response");
        formEl.reset();
        setStatus({
          state: "ok",
          msg: "Thank you! Your message has been sent to Manohar. I will get back to you soon.",
        });
      } catch (err) {
        console.error("Form delivery error:", err);
        // Fallback to mailto
        if (primaryEmail) {
          const subject = encodeURIComponent(`Portfolio message from ${name}`);
          const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${from})`);
          window.location.href = `mailto:${primaryEmail}?subject=${subject}&body=${body}`;
          setStatus({
            state: "ok",
            msg: "Your email client opened with the message ready to send.",
          });
        } else {
          setStatus({
            state: "error",
            msg: "Could not send the message directly. Please contact me via WhatsApp or email directly.",
          });
        }
      }
      return;
    }

    // 3. Mailto fallback
    if (primaryEmail) {
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${from})`);
      window.location.href = `mailto:${primaryEmail}?subject=${subject}&body=${body}`;
      setStatus({
        state: "ok",
        msg: "Your email client opened with the message ready to send.",
      });
    } else {
      setStatus({
        state: "error",
        msg: "The contact form is not connected. Please contact via WhatsApp.",
      });
    }
  };

  const socialLinks = [
    { href: whatsappLink, label: "WhatsApp", Icon: WhatsAppIcon },
    { href: linkedinUrl, label: "LinkedIn", Icon: Linkedin },
    { href: githubUrl, label: "GitHub", Icon: Github },
    { href: cleanLink(socials.instagram), label: "Instagram", Icon: Instagram },
    { href: cleanLink(socials.youtube), label: "YouTube", Icon: Youtube },
  ].filter((s) => s.href);

  return (
    <section id="contact" className="section container">
      <div className="contact-grid">
        {/* Left Column: Rich Channels & Contact Details */}
        <div className="contact-copy">
          <div className="contact-head">
            <h2>{contact.heading || "Let's talk"}</h2>
            <p className="body">
              {contact.intro ||
                "Have a project, an internship or a collaboration in mind? Send a message and I will reply as soon as I can."}
            </p>
          </div>

          <div className="contact-channels">
            {/* WhatsApp Card */}
            <div className="contact-channel-card is-whatsapp">
              <div className="channel-icon-wrap whatsapp-color">
                <WhatsAppIcon size={22} />
              </div>
              <div className="channel-content">
                <span className="channel-label">WhatsApp</span>
                <span className="channel-value">{whatsappNum}</span>
              </div>
              <div className="channel-actions">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="channel-btn is-action"
                  title="Chat on WhatsApp"
                >
                  Chat <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Primary Email (Gmail) */}
            <div className="contact-channel-card">
              <div className="channel-icon-wrap">
                <Mail size={20} />
              </div>
              <div className="channel-content">
                <span className="channel-label">Primary Email (Gmail)</span>
                <a href={`mailto:${primaryEmail}`} className="channel-value-link">
                  {primaryEmail}
                </a>
              </div>
              <div className="channel-actions">
                <button
                  type="button"
                  className="channel-btn icon-only"
                  onClick={() => copyToClipboard(primaryEmail, "gmail")}
                  title="Copy email"
                >
                  {copiedKey === "gmail" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Secondary Email (Outlook) */}
            {secondaryEmail && (
              <div className="contact-channel-card">
                <div className="channel-icon-wrap">
                  <Mail size={20} />
                </div>
                <div className="channel-content">
                  <span className="channel-label">Secondary Email (Outlook)</span>
                  <a href={`mailto:${secondaryEmail}`} className="channel-value-link">
                    {secondaryEmail}
                  </a>
                </div>
                <div className="channel-actions">
                  <button
                    type="button"
                    className="channel-btn icon-only"
                    onClick={() => copyToClipboard(secondaryEmail, "outlook")}
                    title="Copy email"
                  >
                    {copiedKey === "outlook" ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* LinkedIn Card */}
            <div className="contact-channel-card">
              <div className="channel-icon-wrap">
                <Linkedin size={20} />
              </div>
              <div className="channel-content">
                <span className="channel-label">LinkedIn</span>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="channel-value-link"
                >
                  Manohar Sudhakar
                </a>
              </div>
              <div className="channel-actions">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="channel-btn is-action"
                  title="View LinkedIn Profile"
                >
                  Connect <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* GitHub Card */}
            <div className="contact-channel-card">
              <div className="channel-icon-wrap">
                <Github size={20} />
              </div>
              <div className="channel-content">
                <span className="channel-label">GitHub</span>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="channel-value-link"
                >
                  Manohar12095
                </a>
              </div>
              <div className="channel-actions">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="channel-btn is-action"
                  title="View GitHub Profile"
                >
                  Follow <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="contact-channel-card is-location">
              <div className="channel-icon-wrap">
                <MapPin size={20} />
              </div>
              <div className="channel-content">
                <span className="channel-label">Location</span>
                <span className="channel-value">
                  {contact.location || "Madurai, Tamil Nadu, India"}
                </span>
              </div>
            </div>
          </div>

          {/* Social Row */}
          {socialLinks.length > 0 && (
            <div className="contact-social-footer">
              <span className="social-footer-label">Connect across platforms:</span>
              <ul className="social-row">
                {socialLinks.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      className="icon-btn"
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                    >
                      <Icon size={19} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Contact Form */}
        <form className="form" onSubmit={onSubmit} noValidate>
          <label>
            Your name
            <input name="name" type="text" autoComplete="name" required placeholder="John Doe" />
          </label>
          <label>
            Your email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
            />
          </label>
          <label>
            Message
            <textarea
              name="message"
              rows={5}
              required
              placeholder="Hi Manohar, I would like to discuss..."
            />
          </label>
          {/* Honeypot field for bot suppression */}
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <button className="btn btn-primary" type="submit" disabled={status.state === "sending"}>
            <Send size={17} /> {status.state === "sending" ? "Sending…" : "Send message"}
          </button>

          <p className={`form-status is-${status.state}`} role="status" aria-live="polite">
            {status.msg}
          </p>
        </form>
      </div>
    </section>
  );
}

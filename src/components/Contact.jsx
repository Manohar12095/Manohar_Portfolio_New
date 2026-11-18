import { useState } from "react";
import { Github, Linkedin, Instagram, Youtube, Mail, MapPin, Send } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { cleanLink, isPlaceholder } from "../lib/url";

export default function Contact() {
  const {
    content: { contact, socials },
  } = useContent();
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const email = contact.email && !isPlaceholder(contact.email) && /^[^\s@]+@[^\s@]+$/.test(contact.email) ? contact.email : "";
  const endpoint = cleanLink(contact.formEndpoint).startsWith("https://") ? cleanLink(contact.formEndpoint) : "";

  const onSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    if (form.get("website")) return; // honeypot: bots fill this hidden field
    const name = String(form.get("name") || "").trim();
    const from = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (!name || !from || !message) {
      setStatus({ state: "error", msg: "Please fill in your name, email and message." });
      return;
    }

    if (endpoint) {
      setStatus({ state: "sending", msg: "Sending…" });
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name, email: from, message }),
        });
        if (!res.ok) throw new Error("bad response");
        formEl.reset();
        setStatus({ state: "ok", msg: "Message sent. Thank you, I will reply soon." });
      } catch {
        setStatus({ state: "error", msg: "The message could not be sent. Please try again or email me directly." });
      }
      return;
    }

    if (email) {
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${from})`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setStatus({ state: "ok", msg: "Your email app should open with the message ready to send." });
    } else {
      setStatus({ state: "error", msg: "The contact form is not connected yet. Please check back soon." });
    }
  };

  const social = [
    { href: cleanLink(socials.github), label: "GitHub", Icon: Github },
    { href: cleanLink(socials.linkedin), label: "LinkedIn", Icon: Linkedin },
    { href: cleanLink(socials.instagram), label: "Instagram", Icon: Instagram },
    { href: cleanLink(socials.youtube), label: "YouTube", Icon: Youtube },
  ].filter((s) => s.href);

  return (
    <section id="contact" className="section container">
      <div className="contact-grid">
        <div className="contact-copy">
          <h2>{contact.heading}</h2>
          <p className="body">{contact.intro}</p>
          <ul className="contact-list">
            {email && (
              <li>
                <Mail size={18} /> <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {contact.location && (
              <li>
                <MapPin size={18} /> {contact.location}
              </li>
            )}
          </ul>
          {social.length > 0 && (
            <ul className="social-row">
              {social.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a className="icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={label}>
                    <Icon size={19} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="form" onSubmit={onSubmit} noValidate>
          <label>
            Your name
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            Your email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Message
            <textarea name="message" rows={5} required />
          </label>
          {/* hidden honeypot field */}
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button className="btn btn-primary" type="submit" disabled={status.state === "sending"}>
            <Send size={17} /> Send message
          </button>
          <p className={`form-status is-${status.state}`} role="status" aria-live="polite">
            {status.msg}
          </p>
        </form>
      </div>
    </section>
  );
}

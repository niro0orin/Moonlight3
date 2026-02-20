"use client";

import { useEffect, useMemo, useState } from "react";

const RTL = "\u202B"; // Right-to-left embedding mark

function buildCopyText({ term, pronunciation, arabicMeaning, arabicDefinition, imageUrl }) {
  // نفس برمجتك: RTL + English term + النطق + المعنى + تعريف مختصر
  const lines = [
    `${RTL}English term: ${term || ""}`,
    `${RTL}Pronunciation (Arabic letters): ${pronunciation || ""}`,
    `${RTL}المعنى بالعربي: ${arabicMeaning || ""}`,
    `${RTL}التعريف/الشرح (بالعربي): ${arabicDefinition || ""}`,
    imageUrl ? `${RTL}Image (URL): ${imageUrl}` : ""
  ].filter(Boolean);

  return lines.join("\n");
}

export default function Page() {
  const [theme, setTheme] = useState("light");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [term, setTerm] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [arabicMeaning, setArabicMeaning] = useState("");
  const [arabicDefinition, setArabicDefinition] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const copyText = useMemo(
    () => buildCopyText({ term, pronunciation, arabicMeaning, arabicDefinition, imageUrl }),
    [term, pronunciation, arabicMeaning, arabicDefinition, imageUrl]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function onSearch() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      // 1) AI formatted fields
      const termRes = await fetch("/api/term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });

      if (!termRes.ok) {
        const t = await termRes.text();
        throw new Error(t || "AI request failed");
      }

      const data = await termRes.json();

      setTerm(data.term || q);
      setPronunciation(data.pronunciation_ar || "");
      setArabicMeaning(data.meaning_ar || "");
      setArabicDefinition(data.definition_ar || "");

      // 2) Web image (Wikipedia thumbnail) from the internet (not generated)
      const imgRes = await fetch(`/api/image?term=${encodeURIComponent(data.term || q)}`);
      if (imgRes.ok) {
        const img = await imgRes.json();
        setImageUrl(img.imageUrl || "");
      } else {
        setImageUrl("");
      }
    } catch (e) {
      alert(`Error: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(copyText);
      alert("Copied ✅");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = copyText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Copied ✅");
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div className="brand">Applemed (Private)</div>
          <button
            className="toggle"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? "Night mode" : "Light mode"}
          </button>
        </div>

        <div className="searchRow">
          <input
            className="input"
            placeholder="اكتب المصطلح الطبي هنا… (مثال: Osteomyelitis)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="btn" onClick={onSearch} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="grid">
          {/* LEFT: Image */}
          <div className="card imageBox">
            <div className="small">الصورة (من النت عبر Wikipedia thumbnail)</div>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="img" src={imageUrl} alt="Result" />
            ) : (
              <div className="small">لا توجد صورة مناسبة لهذا المصطلح.</div>
            )}
            {imageUrl ? <div className="small">{imageUrl}</div> : null}
          </div>

          {/* RIGHT: Data */}
          <div className="card fields">
            <div>
              <div className="label">English term</div>
              <textarea className="textarea" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>

            <div>
              <div className="label">Pronunciation (Arabic letters)</div>
              <textarea
                className="textarea"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
              />
            </div>

            <div>
              <div className="label">المعنى بالعربي</div>
              <textarea
                className="textarea"
                value={arabicMeaning}
                onChange={(e) => setArabicMeaning(e.target.value)}
              />
            </div>

            <div>
              <div className="label">التعريف/الشرح (بالعربي)</div>
              <textarea
                className="textarea"
                value={arabicDefinition}
                onChange={(e) => setArabicDefinition(e.target.value)}
              />
            </div>

            <div className="actions">
              <button className="btn" onClick={copyAll}>
                Copy all
              </button>
              <button
                className="btn"
                onClick={() => {
                  setTerm("");
                  setPronunciation("");
                  setArabicMeaning("");
                  setArabicDefinition("");
                  setImageUrl("");
                  setQuery("");
                }}
              >
                Clear
              </button>
            </div>

            <div className="notice">
              النسخ يطلع بنفس “برمجتك”: RTL + English term + النطق + المعنى + تعريف مختصر + رابط الصورة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

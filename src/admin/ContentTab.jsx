import { useEffect, useState } from "react";
import { DEFAULTS, fetchContent, saveContent } from "../content";

const PAGES = {
  home: {
    label: "Home",
    fields: ["title", "lead", "ctaTitle", "ctaText"],
  },
  tentang: {
    label: "Tentang",
    fields: ["lead", "paragraphs", "values"],
  },
  dokumentasi: {
    label: "Dokumentasi",
    fields: ["lead", "steps", "faq"],
  },
  kontak: {
    label: "Kontak",
    fields: ["lead", "wa", "instagram", "shopee", "email", "address"],
  },
};

const JSON_FIELDS = new Set(["paragraphs", "values", "steps", "faq"]);

function Field({ field, value, onChange }) {
  const isJson = JSON_FIELDS.has(field);
  const currentValue = isJson ? JSON.stringify(value ?? [], null, 2) : value ?? "";

  if (isJson) {
    return (
      <label>
        {field}
        <textarea
          rows={8}
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  return (
    <label>
      {field}
      <input
        type={field === "email" ? "email" : "text"}
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function ContentTab({ onError }) {
  const [page, setPage] = useState("home");
  const [content, setContent] = useState(DEFAULTS.home);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let active = true;
    fetchContent(page).then((data) => {
      if (active) setContent(data);
    });
    return () => {
      active = false;
    };
  }, [page]);

  const updateField = (key, rawValue) => {
    setMsg("");
    if (JSON_FIELDS.has(key)) {
      try {
        const parsed = JSON.parse(rawValue);
        setContent((prev) => ({ ...prev, [key]: parsed }));
        return;
      } catch {
        setMsg("Format JSON tidak valid untuk field ini.");
        return;
      }
    }

    setContent((prev) => ({ ...prev, [key]: rawValue }));
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await saveContent(page, content);
      setMsg("Konten berhasil disimpan.");
    } catch (e) {
      const error = e?.message || "Gagal menyimpan konten.";
      setMsg(error);
      if (onError) onError(error);
    } finally {
      setSaving(false);
    }
  };

  const pageMeta = PAGES[page];

  return (
    <div className="adm-split">
      <div className="card">
        <h3>Kelola konten situs</h3>
        <div className="adm-pills" style={{ marginBottom: "1rem" }}>
          {Object.entries(PAGES).map(([key, item]) => (
            <button
              key={key}
              className={page === key ? "act" : ""}
              onClick={() => setPage(key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {pageMeta.fields.map((field) => (
          <Field
            key={field}
            field={field}
            value={content[field]}
            onChange={(value) => updateField(field, value)}
          />
        ))}

        <button onClick={save} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan konten"}
        </button>
        {msg && <p className={msg.includes("berhasil") ? "hint" : "err"}>{msg}</p>}
      </div>
    </div>
  );
}

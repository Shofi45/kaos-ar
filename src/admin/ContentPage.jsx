import { useEffect, useRef, useState } from "react";
import { DEFAULTS, fetchContent, saveContent } from "../content";

const CHECKS = {
  url: (v) => /^https?:\/\//i.test(v) || "harus diawali https://",
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "format email tidak valid",
  digits: (v) =>
    /^\d{8,15}$/.test(v) ||
    "harus angka saja tanpa + atau spasi, contoh 6281234567890",
};

const blank = (fields) =>
  Object.fromEntries(
    fields.map((f) => [f.key, f.type === "select" ? f.options[0].value : ""]),
  );

const clean = (v) => {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]));
  }
  return typeof v === "string" ? v.trim() : v;
};

function validate(fields, obj) {
  for (const f of fields) {
    const s = (obj?.[f.key] ?? "").toString().trim();
    if (f.required && !s) return `${f.label} wajib diisi.`;
    if (s && f.check) {
      const r = CHECKS[f.check](s);
      if (r !== true) return `${f.label} ${r}`;
    }
  }
  return "";
}

const shown = (f, value) => {
  if (f.type === "select") {
    return f.options.find((o) => o.value === value)?.label || value || "";
  }
  return value || "";
};

function useFlash() {
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const timer = useRef();
  const flash = (text, ok = true) => {
    clearTimeout(timer.current);
    setMsg({ ok, text });
    if (ok) timer.current = setTimeout(() => setMsg({ ok: true, text: "" }), 3000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, flash];
}

function Field({ f, value, onChange }) {
  const set = (e) => onChange(e.target.value);
  let control;
  if (f.type === "area") {
    control = <textarea rows={f.rows || 4} value={value ?? ""} onChange={set} />;
  } else if (f.type === "select") {
    control = (
      <select value={value ?? f.options[0].value} onChange={set}>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        type="text"
        inputMode={f.inputMode}
        placeholder={f.placeholder}
        value={value ?? ""}
        onChange={set}
      />
    );
  }
  return (
    <label>
      {f.label}
      {f.required && " *"}
      {control}
      {f.hint && <small className="hint">{f.hint}</small>}
    </label>
  );
}

function FormView({ view, data, defaults, persist, inline }) {
  const pick = () =>
    Object.fromEntries(view.fields.map((f) => [f.key, data[f.key] ?? ""]));
  const [draft, setDraft] = useState(pick);
  const [busy, setBusy] = useState(false);
  const [msg, flash] = useFlash();
  const dirty = view.fields.some(
    (f) => (draft[f.key] ?? "") !== (data[f.key] ?? ""),
  );

  const save = async () => {
    const err = validate(view.fields, draft);
    if (err) return flash(err, false);
    setBusy(true);
    try {
      await persist({ ...data, ...clean(draft) });
      flash("Tersimpan.");
    } catch (e) {
      flash(e?.message || "Gagal menyimpan.", false);
    } finally {
      setBusy(false);
    }
  };

  const useDefaults = () => {
    if (!window.confirm("Isi kolom dengan teks bawaan? Baru tersimpan setelah kamu menekan Simpan.")) return;
    setDraft(Object.fromEntries(view.fields.map((f) => [f.key, defaults[f.key] ?? ""])));
  };

  const form = (
    <div className="card">
      <h3>{view.label}</h3>
      {view.note && <p className="hint">{view.note}</p>}
      <div className={inline ? "ct-grid" : "ct-fields"}>
        {view.fields.map((f) => (
          <Field
            key={f.key}
            f={f}
            value={draft[f.key]}
            onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
          />
        ))}
      </div>
      <button onClick={save} disabled={busy || !dirty}>
        {busy ? "Menyimpan..." : "Simpan"}
      </button>
      <button className="small ghost" onClick={useDefaults} disabled={busy}>
        Isi teks bawaan
      </button>
      {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
    </div>
  );

  if (inline) return form;

  return (
    <div className="adm-split">
      {form}
      <div className="card ct-preview">
        <h3>Tampilan saat ini</h3>
        {view.fields.map((f) => (
          <div className="ct-line" key={f.key}>
            <span>{f.label}</span>
            <p>{shown(f, data[f.key]) || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemForm({ L, item, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    ...blank(L.itemFields),
    ...(item || {}),
  }));
  const [busy, setBusy] = useState(false);
  const [msg, flash] = useFlash();

  const submit = async () => {
    const err = validate(L.itemFields, draft);
    if (err) return flash(err, false);
    setBusy(true);
    const ok = await onSubmit(clean(draft), flash);
    setBusy(false);
    if (ok && !item) setDraft(blank(L.itemFields));
  };

  return (
    <div className="card">
      <h3>{item ? `Ubah ${L.itemName.toLowerCase()}` : `Tambah ${L.itemName.toLowerCase()}`}</h3>
      {L.itemFields.map((f) => (
        <Field
          key={f.key}
          f={f}
          value={draft[f.key]}
          onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
        />
      ))}
      <button onClick={submit} disabled={busy}>
        {busy ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah"}
      </button>
      {item && (
        <button className="small ghost" onClick={onCancel}>
          Batal ubah
        </button>
      )}
      {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
    </div>
  );
}

function HeadingForm({ field, data, persist }) {
  const [value, setValue] = useState(data[field.key] ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, flash] = useFlash();
  const dirty = value !== (data[field.key] ?? "");

  const save = async () => {
    setBusy(true);
    try {
      await persist({ ...data, [field.key]: value.trim() });
      flash("Tersimpan.");
    } catch (e) {
      flash(e?.message || "Gagal menyimpan.", false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Judul bagian</h3>
      <Field f={field} value={value} onChange={setValue} />
      <button onClick={save} disabled={busy || !dirty}>
        {busy ? "Menyimpan..." : "Simpan judul"}
      </button>
      {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
    </div>
  );
}

function ListView({ view, data, persist }) {
  const L = view.list;
  const items = data[L.key] || [];
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [msg, flash] = useFlash();
  const formRef = useRef(null);

  const commit = async (next) => {
    try {
      await persist({ ...data, [L.key]: next });
      return true;
    } catch (e) {
      flash(e?.message || "Gagal menyimpan.", false);
      return false;
    }
  };

  const submit = async (values, flashForm) => {
    const next =
      editing === null
        ? [...items, values]
        : items.map((it, i) => (i === editing ? values : it));
    const ok = await commit(next);
    if (!ok) {
      flashForm("Gagal menyimpan. Coba lagi.", false);
      return false;
    }
    if (editing === null) {
      flashForm(`${L.itemName} ditambahkan.`);
    } else {
      flash("Perubahan tersimpan.");
      setEditing(null);
      setFormKey((k) => k + 1);
    }
    return true;
  };

  const edit = (i) => {
    setEditing(i);
    setFormKey((k) => k + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const move = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    if (await commit(next)) {
      if (editing === i) setEditing(j);
      else if (editing === j) setEditing(i);
    }
  };

  const remove = async (i) => {
    if (L.min && items.length <= L.min) {
      return flash(`Minimal ${L.min} item harus ada.`, false);
    }
    if (!window.confirm(`Hapus ${L.itemName.toLowerCase()} #${i + 1}?`)) return;
    if (await commit(items.filter((_, n) => n !== i))) {
      if (editing === i) {
        setEditing(null);
        setFormKey((k) => k + 1);
      } else if (editing !== null && editing > i) {
        setEditing(editing - 1);
      }
    }
  };

  const titleKey = L.titleKey || L.itemFields[0].key;
  const metaField = L.metaKey && L.itemFields.find((f) => f.key === L.metaKey);

  return (
    <div className="adm-split">
      <div className="ct-left" ref={formRef}>
        <ItemForm
          key={formKey}
          L={L}
          item={editing === null ? null : items[editing]}
          onSubmit={submit}
          onCancel={() => {
            setEditing(null);
            setFormKey((k) => k + 1);
          }}
        />
        {view.heading && (
          <HeadingForm
            key={data[view.heading.key]}
            field={view.heading}
            data={data}
            persist={persist}
          />
        )}
      </div>

      <div className="ct-stack">
        {view.note && <p className="hint">{view.note}</p>}
        {msg.text && <p className={msg.ok ? "hint" : "err"}>{msg.text}</p>}
        {!items.length && <p className="hint">Belum ada item.</p>}
        {items.map((it, i) => (
          <div
            className={editing === i ? "card ct-item editing" : "card ct-item"}
            key={i}
          >
            <div className="ct-item-main">
              <span className="ct-num">{i + 1}</span>
              <div>
                <strong>{it[titleKey] || "(kosong)"}</strong>
                {L.textKey && it[L.textKey] && <p>{it[L.textKey]}</p>}
                {metaField && (
                  <span className="ct-chip">{shown(metaField, it[L.metaKey])}</span>
                )}
              </div>
            </div>
            <div className="ct-actions">
              <button className="small" onClick={() => edit(i)}>
                Ubah
              </button>
              <button
                className="small ghost"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label="Naikkan"
              >
                ↑
              </button>
              <button
                className="small ghost"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Turunkan"
              >
                ↓
              </button>
              <button className="small danger" onClick={() => remove(i)}>
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentPage({ pageKey, views, onError, inline }) {
  const [data, setData] = useState(null);
  const [viewId, setViewId] = useState(views[0].id);

  useEffect(() => {
    let alive = true;
    setData(null);
    setViewId(views[0].id);
    fetchContent(pageKey, true).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [pageKey, views]);

  const persist = async (next) => {
    const prev = data;
    setData(next);
    try {
      await saveContent(pageKey, clean(next));
    } catch (e) {
      setData(prev);
      onError?.(e?.message || "Gagal menyimpan.");
      throw e;
    }
  };

  if (!data) return <p className="hint">Memuat...</p>;

  const view = views.find((v) => v.id === viewId) || views[0];
  const common = { data, persist, defaults: DEFAULTS[pageKey] };

  return (
    <div className="ct">
      {views.length > 1 && (
        <div className="adm-pills ct-pills">
          {views.map((v) => (
            <button
              key={v.id}
              className={v.id === view.id ? "act" : ""}
              onClick={() => setViewId(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {view.kind === "list" ? (
        <ListView key={view.id} view={view} {...common} />
      ) : (
        <FormView key={view.id} view={view} inline={inline} {...common} />
      )}
    </div>
  );
}
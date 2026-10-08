import { useState } from "react";
import { fetchContent } from "../content";
import {
  removeProduct,
  rupiah,
  saveProduct,
  toggleProduct,
  visible,
} from "./api";

function OptionSelect({ label, value, onChange, options, menu }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Tidak dipilih</option>
        {options.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
        {value && !options.includes(value) && (
          <option value={value}>{value} (belum terdaftar)</option>
        )}
      </select>
      {!options.length && (
        <small className="hint">
          Belum ada pilihan. Tambahkan di menu {menu}.
        </small>
      )}
    </label>
  );
}

function ProductForm({ designs, editing, onSaved, onCancel }) {
  const [name, setName] = useState(editing?.name || "");
  const [price, setPrice] = useState(editing ? String(editing.price) : "");
  const [category, setCategory] = useState(editing?.category || "");
  const [oldPrice, setOldPrice] = useState(
    editing?.old_price ? String(editing.old_price) : "",
  );
  const [shopee, setShopee] = useState(editing?.shopee_url || "");
  const [designSlug, setDesignSlug] = useState(editing?.design_slug || "");
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [kategori, setKategori] = useState([]);
  const [fabric, setFabric] = useState(editing?.fabric || "");
  const [printType, setPrintType] = useState(editing?.print_type || "");
  const [kainList, setKainList] = useState([]);
  const [printList, setPrintList] = useState([]);

  useEffect(() => {
    fetchContent("kategori", true).then((c) => setKategori(c.list || []));
    fetchContent("kain", true).then((c) => setKainList(c.list || []));
    fetchContent("print", true).then((c) => setPrintList(c.list || []));
  }, []);

  const submit = async () => {
    setMsg("");
    if (!name.trim()) return setMsg("Nama produk wajib diisi.");
    if (!/^\d+$/.test(price.trim()))
      return setMsg("Harga harus angka saja. Contoh: 85000");
    if (
      oldPrice.trim() &&
      (!/^\d+$/.test(oldPrice.trim()) ||
        Number(oldPrice.trim()) <= Number(price.trim()))
    ) {
      return setMsg("Harga coret harus angka dan lebih besar dari harga jual.");
    }
    if (shopee.trim() && !/^https?:\/\//.test(shopee.trim())) {
      return setMsg("Link Shopee harus diawali https://");
    }
    if (!editing && !imageFile) return setMsg("Produk baru butuh foto.");
    if (imageFile && !/\.(png|jpe?g|webp)$/i.test(imageFile.name)) {
      return setMsg("Foto harus PNG, JPG, atau WEBP.");
    }

    setBusy(true);
    try {
      await saveProduct({
        old: editing,
        name: name.trim(),
        price: Number(price.trim()),
        old_price: oldPrice.trim() ? Number(oldPrice.trim()) : null,
        category: category.trim(),
        fabric,
        print_type: printType,
        shopee_url: shopee.trim(),
        design_slug: designSlug,
        imageFile,
      });
      onSaved();
    } catch (e) {
      setMsg(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>{editing ? "Ubah produk" : "Tambah produk"}</h3>
      <input
        placeholder="Nama produk"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Harga, contoh: 85000"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        placeholder="Harga coret (opsional), contoh: 120000"
        inputMode="numeric"
        value={oldPrice}
        onChange={(e) => setOldPrice(e.target.value)}
      />
      <label>
        Kategori
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Tanpa kategori</option>
          {kategori.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
          {category && !kategori.includes(category) && (
            <option value={category}>{category} (belum terdaftar)</option>
          )}
        </select>
        {!kategori.length && (
          <small className="hint">
            Belum ada kategori. Tambahkan di menu Kategori.
          </small>
        )}
      </label>
      <OptionSelect
        label="Jenis print"
        value={printType}
        onChange={setPrintType}
        options={printList}
        menu="Jenis print"
      />
      <OptionSelect
        label="Jenis kain"
        value={fabric}
        onChange={setFabric}
        options={kainList}
        menu="Jenis kain"
      />
      <input
        placeholder="Link Shopee (https://...)"
        value={shopee}
        onChange={(e) => setShopee(e.target.value)}
      />
      <label>
        Desain AR terkait
        <select
          value={designSlug}
          onChange={(e) => setDesignSlug(e.target.value)}
        >
          <option value="">Tanpa AR</option>
          {designs.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.title || d.slug}
            </option>
          ))}
        </select>
      </label>
      <label>
        Foto produk {editing && "(kosongkan jika tidak diganti)"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />
      </label>
      <button disabled={busy} onClick={submit}>
        {busy ? "Menyimpan..." : "Simpan produk"}
      </button>
      {editing && (
        <button className="small ghost" onClick={onCancel}>
          Batal ubah
        </button>
      )}
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}

function ProductItem({ product, onEdit, onToggle, onRemove }) {
  return (
    <div className="card">
      <div className="row">
        <div className="pitem">
          {product.image_url && (
            <img className="pthumb" src={product.image_url} alt="" />
          )}
          <div>
            <strong>{product.name}</strong>
            <div className="hint">
              {rupiah(product.price)}
              {product.category ? ` • ${product.category}` : ""}
              {product.print_type ? ` • ${product.print_type}` : ""}
              {product.fabric ? ` • ${product.fabric}` : ""}
              {product.design_slug ? ` • AR: ${product.design_slug}` : ""}
            </div>
          </div>
        </div>
        <span className={product.active ? "on" : "off"}>
          {product.active ? "aktif" : "nonaktif"}
        </span>
      </div>
      <div className="row">
        <button className="small" onClick={() => onEdit(product)}>
          Ubah
        </button>
        <button className="small" onClick={() => onToggle(product)}>
          {product.active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button className="small danger" onClick={() => onRemove(product)}>
          Hapus
        </button>
      </div>
    </div>
  );
}

export default function ProductsTab({
  products,
  designs,
  q,
  filter,
  onReload,
  onError,
}) {
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const shown = visible(
    products,
    q,
    filter,
    (p) => `${p.name} ${p.category || ""}`,
  );

  const done = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    onReload();
  };

  const onEdit = (p) => {
    setEditing(p);
    setFormKey((k) => k + 1);
    document.querySelector(".adm-content")?.scrollTo({ top: 0 });
  };

  const onToggle = async (p) => {
    const { error } = await toggleProduct(p);
    if (error) onError(error.message);
    onReload();
  };

  const onRemove = async (p) => {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    const { error } = await removeProduct(p);
    if (error) onError(error.message);
    onReload();
  };

  return (
    <div className="adm-split">
      <ProductForm
        key={formKey}
        designs={designs}
        editing={editing}
        onSaved={done}
        onCancel={done}
      />
      <div className="adm-list">
        {shown.map((p) => (
          <ProductItem
            key={p.id}
            product={p}
            onEdit={onEdit}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
        {!shown.length && <p className="hint">Tidak ada produk.</p>}
      </div>
    </div>
  );
}

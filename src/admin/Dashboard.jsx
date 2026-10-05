import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "../supabase";
import { designLink } from "./constants";
import { fetchDesigns, toggleDesign, removeDesign } from "./api";
import DesignForm from "./DesignForm";
import DesignCard from "./DesignCard";
import QrModal from "./QrModal";

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await fetchDesigns();
    if (error) setMsg(error.message);
    else setList(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = async (d) => {
    const { error } = await toggleDesign(d);
    if (error) setMsg(error.message);
    load();
  };

  const onRemove = async (d) => {
    if (
      !window.confirm(
        `Hapus desain "${d.slug}"? QR di kaos yang sudah tercetak akan berhenti bekerja.`,
      )
    )
      return;
    const { error } = await removeDesign(d);
    if (error) setMsg(error.message);
    load();
  };

  const onQr = async (d) => {
    const url = await QRCode.toDataURL(designLink(d.slug), {
      width: 512,
      margin: 2,
    });
    setQr({ slug: d.slug, url });
  };

  return (
    <>
      <div className="row">
        <h2>Desain AR</h2>
        <button className="small" onClick={() => supabase.auth.signOut()}>
          Keluar
        </button>
      </div>

      {msg && <p className="err">{msg}</p>}

      <DesignForm list={list} onSaved={load} />

      {list.map((d) => (
        <DesignCard
          key={d.slug}
          design={d}
          onQr={onQr}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}

      {qr && <QrModal qr={qr} onClose={() => setQr(null)} />}
    </>
  );
}

import { AR_URL } from "../config";
import { rupiah } from "../api";

export default function ProductCard({ p }) {
  const off =
    p.old_price && p.old_price > p.price
      ? Math.round((1 - p.price / p.old_price) * 100)
      : 0;

  return (
    <div className="kcard">
      <div className="kimg">
        {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" />}
        {off > 0 && <span className="kbadge">{off}% off</span>}
        {p.design_slug && <span className="kar">AR</span>}
      </div>
      <div className="kbody">
        {p.category && <small>{p.category}</small>}
        <strong>{p.name}</strong>
        <div className="kprice">
          <b>{rupiah(p.price)}</b>
          {off > 0 && <s>{rupiah(p.old_price)}</s>}
        </div>
        <div className="kact">
          {p.shopee_url && (
            <a
              className="pbtn"
              href={p.shopee_url}
              target="_blank"
              rel="noreferrer"
            >
              Beli di Shopee
            </a>
          )}
          {p.design_slug && (
            <a className="pbtn alt" href={AR_URL}>
              Coba AR
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

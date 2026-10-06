import Page from "./Page";
import { AR_URL } from "../config";
import { useContent } from "../content";

export default function Dokumentasi() {
  const c = useContent("dokumentasi");

  return (
    <Page title="Panduan Scan AR" lead={c.lead}>
      <section className="sec">
        <h2>Langkah singkat</h2>
        <div className="steps">
          {(c.steps || []).map((s, i) => (
            <div className="step" key={i}>
              <b>{i + 1}</b>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="hero-cta pg-gap">
          <a className="pbtn" href={AR_URL}>
            Buka Scan AR
          </a>
        </div>
      </section>

      <section className="sec">
        <h2>Pertanyaan umum</h2>
        <div className="faq">
          {(c.faq || []).map((f, i) => (
            <details key={i}>
              <summary>{f.title}</summary>
              <p>{f.text}</p>
            </details>
          ))}
        </div>
      </section>
    </Page>
  );
}

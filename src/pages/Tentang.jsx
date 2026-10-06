import Page from "./Page";
import { useContent } from "../content";

export default function Tentang() {
  const c = useContent("tentang");

  return (
    <Page title="Tentang Zayfen" lead={c.lead}>
      <section className="sec">
        {(c.paragraphs || []).map((p, i) => (
          <p className="pg-text" key={i}>
            {p.text}
          </p>
        ))}
      </section>

      <section className="sec">
        <h2>Yang kami pegang</h2>
        <div className="steps">
          {(c.values || []).map((v, i) => (
            <div className="info" key={i}>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </Page>
  );
}

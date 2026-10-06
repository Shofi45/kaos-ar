import Navbar from "../site/Navbar";
import Footer from "../site/Footer";
import "../styles/pages.css";

export default function Page({ title, lead, children }) {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <Navbar />
      <main className="pg">
        {title && (
          <header className="pg-head">
            <h1>{title}</h1>
            {lead && <p>{lead}</p>}
          </header>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}

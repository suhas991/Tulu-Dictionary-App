import SiteHeader from '../components/SiteHeader'

export default function IntroPage() {
  return <main className="page-shell intro-page"><SiteHeader /><section className="hero"><div className="hero-copy"><p className="eyebrow">A living language archive</p><h1>Words that carry <em>home</em> with them.</h1><p>Explore the connections between English, Tulu, Kannada, and Telugu. Learn a word, remember its meaning, and pass it on.</p><a className="add-button hero-action" href="/learn">Start learning <span aria-hidden="true">→</span></a></div><div className="hero-panel"><span className="hero-panel-label">The four-way bridge</span><div className="language-orbit"><b>EN</b><b>TU</b><b>ಕನ್ನಡ</b><b>తెలుగు</b></div><p>Every entry keeps the vocabulary connected across the languages we live with.</p></div></section></main>
}

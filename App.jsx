import { useState, useEffect, useRef } from "react";

const PIZZAS = [
  {
    id: 1,
    name: "Margherita Classica",
    price: 14.99,
    desc: "San Marzano tomatoes, fresh mozzarella, basil",
    emoji: "🍕",
    tags: ["vegetarian", "classic"],
    color: "#e8472a",
  },
  {
    id: 2,
    name: "Pepperoni Fuoco",
    price: 17.99,
    desc: "Spicy pepperoni, mozzarella, fiery tomato sauce",
    emoji: "🔥",
    tags: ["spicy", "meat"],
    color: "#c0392b",
  },
  {
    id: 3,
    name: "Truffle Bianca",
    price: 22.99,
    desc: "White sauce, truffle oil, arugula, parmesan",
    emoji: "🌿",
    tags: ["vegetarian", "gourmet"],
    color: "#2c7a3a",
  },
  {
    id: 4,
    name: "BBQ Smokehouse",
    price: 19.99,
    desc: "Pulled pork, smoked bacon, BBQ drizzle, red onion",
    emoji: "🥩",
    tags: ["meat", "smoky"],
    color: "#8B4513",
  },
  {
    id: 5,
    name: "Quattro Formaggi",
    price: 18.99,
    desc: "Mozzarella, gorgonzola, fontina, parmesan",
    emoji: "🧀",
    tags: ["vegetarian", "cheese"],
    color: "#d4a017",
  },
  {
    id: 6,
    name: "Neptune's Catch",
    price: 24.99,
    desc: "Shrimp, calamari, clams, garlic, olive oil",
    emoji: "🦐",
    tags: ["seafood", "gourmet"],
    color: "#1a6b8a",
  },
];

const SIZES = [
  { id: "s", label: "Small", inches: '10"', multiplier: 0.8 },
  { id: "m", label: "Medium", inches: '12"', multiplier: 1.0 },
  { id: "l", label: "Large", inches: '14"', multiplier: 1.25 },
  { id: "xl", label: "XL", inches: '16"', multiplier: 1.5 },
];

const CRUST = ["Classic", "Thin & Crispy", "Stuffed", "Gluten-Free"];

const EXTRA_TOPPINGS = [
  "Mushrooms", "Jalapeños", "Olives", "Anchovies",
  "Roasted Peppers", "Spinach", "Sun-dried Tomatoes", "Prosciutto",
];

function callClaude(messages, systemPrompt) {
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  }).then((r) => r.json());
}

export default function PizzaApp() {
  const [screen, setScreen] = useState("menu");
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState("m");
  const [crust, setCrust] = useState("Classic");
  const [toppings, setToppings] = useState([]);
  const [cart, setCart] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([
    {
      role: "assistant",
      content: "Ciao! 👨‍🍳 I'm Chef Marco, your personal pizza advisor. Ask me anything — recommendations, ingredients, allergens, or what pairs well together!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiRec, setAiRec] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [estimatedTime] = useState(Math.floor(Math.random() * 10) + 20);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  const getAIRecommendation = async () => {
    setRecLoading(true);
    setAiRec(null);
    const data = await callClaude(
      [{ role: "user", content: "Give me a short, enthusiastic pizza recommendation for today. Mention one pizza from this list: Margherita Classica, Pepperoni Fuoco, Truffle Bianca, BBQ Smokehouse, Quattro Formaggi, Neptune's Catch. Include a one-liner reason and an emoji. Keep it under 2 sentences." }],
      "You are an enthusiastic Italian chef named Marco. Be warm, brief, and passionate about pizza."
    );
    setRecLoading(false);
    if (data.content?.[0]?.text) setAiRec(data.content[0].text);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newMsgs = [...chatMsgs, userMsg];
    setChatMsgs(newMsgs);
    setChatInput("");
    setChatLoading(true);
    const apiMsgs = newMsgs.map((m) => ({ role: m.role, content: m.content }));
    const data = await callClaude(
      apiMsgs,
      `You are Chef Marco, a warm and knowledgeable Italian pizza chef at Fornaio Napoletano. Menu: ${PIZZAS.map((p) => `${p.name} ($${p.price}) - ${p.desc}`).join("; ")}. Sizes: Small 10", Medium 12", Large 14", XL 16". Crusts: Classic, Thin & Crispy, Stuffed, Gluten-Free. Be helpful, concise, and passionate.`
    );
    setChatLoading(false);
    if (data.content?.[0]?.text) {
      setChatMsgs((prev) => [...prev, { role: "assistant", content: data.content[0].text }]);
    }
  };

  const addToCart = () => {
    const sizeObj = SIZES.find((s) => s.id === size);
    const basePrice = selected.price * sizeObj.multiplier + toppings.length * 1.5;
    setCart((prev) => [...prev, { id: Date.now(), pizza: selected, size: sizeObj, crust, toppings, price: basePrice }]);
    setScreen("menu");
    setToppings([]);
    setSize("m");
    setCrust("Classic");
  };

  const total = cart.reduce((s, i) => s + i.price, 0);
  const placeOrder = () => { setScreen("confirm"); setCart([]); };

  if (screen === "confirm") {
    return (
      <div style={styles.confirmScreen}>
        <div style={styles.confirmBox}>
          <div style={styles.confEmoji}>🎉</div>
          <h1 style={styles.confTitle}>Order Placed!</h1>
          <p style={styles.confSub}>Your pizza is in the oven at <strong>Fornaio Napoletano</strong>.</p>
          <div style={styles.confTime}>⏱ Est. delivery: <strong>{estimatedTime}–{estimatedTime + 5} min</strong></div>
          <div style={styles.confOrder}>Order #FN-{Math.floor(Math.random() * 9000) + 1000}</div>
          <button style={styles.confBtn} onClick={() => setScreen("menu")}>Order Again</button>
        </div>
      </div>
    );
  }

  if (screen === "chat") {
    return (
      <div style={styles.root}>
        <Header cart={cart} setScreen={setScreen} screen="chat" />
        <div style={styles.chatWrap}>
          <div style={styles.chefBanner}>
            <span style={styles.chefAvatar}>👨‍🍳</span>
            <div>
              <div style={styles.chefName}>Chef Marco</div>
              <div style={styles.chefRole}>Personal Pizza Advisor · AI Powered</div>
            </div>
            <div style={styles.onlineDot} />
          </div>
          <div style={styles.chatMessages}>
            {chatMsgs.map((m, i) => (
              <div key={i} style={m.role === "user" ? styles.userBubble : styles.aiBubble}>
                {m.role === "assistant" && <span style={styles.bubbleAvatar}>👨‍🍳</span>}
                <div style={m.role === "user" ? styles.userText : styles.aiText}>{m.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={styles.aiBubble}>
                <span style={styles.bubbleAvatar}>👨‍🍳</span>
                <div style={styles.aiText}>●●●</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.chatInputRow}>
            <input
              style={styles.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Ask about ingredients, allergens, recommendations…"
            />
            <button style={styles.sendBtn} onClick={sendChat} disabled={chatLoading}>↑</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "cart") {
    return (
      <div style={styles.root}>
        <Header cart={cart} setScreen={setScreen} screen="cart" />
        <div style={styles.cartWrap}>
          <h2 style={styles.sectionTitle}>Your Order</h2>
          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <div style={{ fontSize: 60 }}>🛒</div>
              <p>Your cart is empty. Add some pizzas!</p>
              <button style={styles.primaryBtn} onClick={() => setScreen("menu")}>Browse Menu</button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={{ fontSize: 36 }}>{item.pizza.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.cartItemName}>{item.pizza.name}</div>
                    <div style={styles.cartItemDetails}>{item.size.label} · {item.crust}{item.toppings.length > 0 && ` · +${item.toppings.join(", ")}`}</div>
                  </div>
                  <div style={styles.cartItemPrice}>${item.price.toFixed(2)}</div>
                  <button style={styles.removeBtn} onClick={() => setCart((c) => c.filter((i) => i.id !== item.id))}>✕</button>
                </div>
              ))}
              <div style={styles.cartSummary}>
                <div style={styles.summaryRow}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div style={styles.summaryRow}><span>Delivery</span><span>$2.99</span></div>
                <div style={styles.summaryRow}><span>Tax</span><span>${(total * 0.08).toFixed(2)}</span></div>
                <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                  <span>Total</span><span>${(total + 2.99 + total * 0.08).toFixed(2)}</span>
                </div>
                <button style={styles.primaryBtn} onClick={placeOrder}>Place Order 🍕</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (screen === "customize") {
    const sizeObj = SIZES.find((s) => s.id === size);
    const itemTotal = selected.price * sizeObj.multiplier + toppings.length * 1.5;
    return (
      <div style={styles.root}>
        <Header cart={cart} setScreen={setScreen} screen="customize" />
        <div style={styles.customizeWrap}>
          <button style={styles.backBtn} onClick={() => setScreen("menu")}>← Back</button>
          <div style={styles.customizeHero}>
            <div style={{ fontSize: 72 }}>{selected.emoji}</div>
            <div>
              <h2 style={styles.customizeTitle}>{selected.name}</h2>
              <p style={styles.customizeDesc}>{selected.desc}</p>
            </div>
          </div>
          <div style={styles.optionSection}>
            <div style={styles.optionLabel}>Size</div>
            <div style={styles.sizeGrid}>
              {SIZES.map((s) => (
                <button key={s.id} style={{ ...styles.sizeBtn, ...(size === s.id ? styles.sizeBtnActive : {}) }} onClick={() => setSize(s.id)}>
                  <div style={styles.sizeName}>{s.label}</div>
                  <div style={styles.sizeInches}>{s.inches}</div>
                  <div style={styles.sizePrice}>+${((s.multiplier - 1) * selected.price).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={styles.optionSection}>
            <div style={styles.optionLabel}>Crust</div>
            <div style={styles.crustGrid}>
              {CRUST.map((c) => (
                <button key={c} style={{ ...styles.crustBtn, ...(crust === c ? styles.crustBtnActive : {}) }} onClick={() => setCrust(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div style={styles.optionSection}>
            <div style={styles.optionLabel}>Extra Toppings <span style={styles.toppingNote}>$1.50 each</span></div>
            <div style={styles.toppingGrid}>
              {EXTRA_TOPPINGS.map((t) => {
                const active = toppings.includes(t);
                return (
                  <button key={t} style={{ ...styles.toppingBtn, ...(active ? styles.toppingBtnActive : {}) }} onClick={() => setToppings((prev) => active ? prev.filter((x) => x !== t) : [...prev, t])}>
                    {active ? "✓ " : ""}{t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={styles.addToCartBar}>
            <div style={styles.itemTotalLabel}>Total: <strong>${itemTotal.toFixed(2)}</strong></div>
            <button style={styles.primaryBtn} onClick={addToCart}>Add to Cart 🛒</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Header cart={cart} setScreen={setScreen} screen="menu" />
      <div style={styles.hero}>
        <div style={styles.heroText}>
          <div style={styles.heroTag}>🍕 Napoletana Since 1987</div>
          <h1 style={styles.heroTitle}>Fornaio<br />Napoletano</h1>
          <p style={styles.heroSub}>Wood-fired perfection, delivered to your door.</p>
        </div>
        <div style={styles.heroFlame}>🔥</div>
      </div>
      <div style={styles.aiRecSection}>
        <div style={styles.aiRecCard}>
          <div style={styles.aiRecHeader}>
            <span>✨ AI Chef's Pick</span>
            <button style={styles.refreshBtn} onClick={getAIRecommendation} disabled={recLoading}>
              {recLoading ? "Thinking…" : "Ask Chef Marco"}
            </button>
          </div>
          {recLoading && <div style={styles.recLoading}>Chef Marco is thinking… 🍷</div>}
          {aiRec && <div style={styles.recText}>{aiRec}</div>}
          {!aiRec && !recLoading && <div style={styles.recPlaceholder}>Click "Ask Chef Marco" for a personalized recommendation powered by AI.</div>}
        </div>
      </div>
      <div style={styles.menuSection}>
        <h2 style={styles.sectionTitle}>Our Menu</h2>
        <div style={styles.pizzaGrid}>
          {PIZZAS.map((p) => (
            <div key={p.id} style={styles.pizzaCard} onClick={() => { setSelected(p); setScreen("customize"); }}>
              <div style={{ ...styles.pizzaColorBar, background: p.color }} />
              <div style={styles.pizzaEmoji}>{p.emoji}</div>
              <div style={styles.pizzaName}>{p.name}</div>
              <div style={styles.pizzaDesc}>{p.desc}</div>
              <div style={styles.pizzaFooter}>
                <span style={styles.pizzaPrice}>from ${p.price.toFixed(2)}</span>
                <span style={styles.pizzaTags}>{p.tags.map((t) => `#${t}`).join(" ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button style={styles.chatFab} onClick={() => setScreen("chat")}>👨‍🍳 Ask Chef</button>
    </div>
  );
}

function Header({ cart, setScreen, screen }) {
  return (
    <header style={styles.header}>
      <button style={styles.logoBtn} onClick={() => setScreen("menu")}>
        <span style={styles.logoEmoji}>🍕</span>
        <span style={styles.logoText}>Fornaio</span>
      </button>
      <nav style={styles.nav}>
        <button style={{ ...styles.navBtn, ...(screen === "chat" ? styles.navActive : {}) }} onClick={() => setScreen("chat")}>👨‍🍳 Chef</button>
        <button style={{ ...styles.navBtn, ...(screen === "cart" ? styles.navActive : {}) }} onClick={() => setScreen("cart")}>
          🛒 {cart.length > 0 && <span style={styles.cartBadge}>{cart.length}</span>}
        </button>
      </nav>
    </header>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#0f0d0a", color: "#f5f0e8", fontFamily: "'Georgia', 'Times New Roman', serif", paddingBottom: 80 },
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(15,13,10,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" },
  logoBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#f5f0e8" },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: "bold", letterSpacing: "0.05em", color: "#e8a430" },
  nav: { display: "flex", gap: 8, alignItems: "center" },
  navBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f0e8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14, position: "relative" },
  navActive: { background: "#e8472a", borderColor: "#e8472a" },
  cartBadge: { background: "#e8a430", color: "#0f0d0a", borderRadius: "50%", padding: "1px 6px", fontSize: 11, fontWeight: "bold", marginLeft: 4 },
  hero: { background: "linear-gradient(135deg, #1a0f00 0%, #2d1500 50%, #0f0d0a 100%)", padding: "60px 24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(232,167,48,0.2)" },
  heroText: { maxWidth: 400 },
  heroTag: { background: "rgba(232,167,48,0.15)", color: "#e8a430", display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 13, marginBottom: 12, border: "1px solid rgba(232,167,48,0.3)" },
  heroTitle: { fontSize: "clamp(36px, 8vw, 64px)", lineHeight: 1.05, margin: "0 0 12px", color: "#f5f0e8", fontStyle: "italic" },
  heroSub: { color: "#9a8c7a", fontSize: 16, margin: 0 },
  heroFlame: { fontSize: "clamp(60px, 15vw, 120px)", filter: "drop-shadow(0 0 30px #e8472a)" },
  aiRecSection: { padding: "24px 24px 0" },
  aiRecCard: { background: "rgba(232,167,48,0.06)", border: "1px solid rgba(232,167,48,0.2)", borderRadius: 12, padding: 20 },
  aiRecHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "#e8a430", fontWeight: "bold", fontSize: 15 },
  refreshBtn: { background: "#e8a430", border: "none", color: "#0f0d0a", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 },
  recLoading: { color: "#9a8c7a", fontStyle: "italic", fontSize: 15 },
  recText: { color: "#f5f0e8", lineHeight: 1.6, fontSize: 15 },
  recPlaceholder: { color: "#6a5a4a", fontSize: 14, fontStyle: "italic" },
  menuSection: { padding: "32px 24px" },
  sectionTitle: { fontSize: 28, fontStyle: "italic", marginBottom: 20, color: "#e8a430", borderBottom: "1px solid rgba(232,167,48,0.2)", paddingBottom: 12 },
  pizzaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  pizzaCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", cursor: "pointer" },
  pizzaColorBar: { height: 4 },
  pizzaEmoji: { fontSize: 48, padding: "20px 20px 8px", display: "block" },
  pizzaName: { fontSize: 18, fontWeight: "bold", padding: "0 20px 6px", color: "#f5f0e8" },
  pizzaDesc: { fontSize: 13, color: "#9a8c7a", padding: "0 20px 16px", lineHeight: 1.5 },
  pizzaFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" },
  pizzaPrice: { color: "#e8a430", fontWeight: "bold", fontSize: 16 },
  pizzaTags: { color: "#4a3a2a", fontSize: 11 },
  chatFab: { position: "fixed", bottom: 24, right: 24, background: "#e8472a", color: "white", border: "none", borderRadius: 50, padding: "14px 20px", fontSize: 15, fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 24px rgba(232,71,42,0.5)", zIndex: 200 },
  customizeWrap: { padding: "24px", maxWidth: 600, margin: "0 auto" },
  backBtn: { background: "none", border: "none", color: "#9a8c7a", cursor: "pointer", fontSize: 15, marginBottom: 20, padding: 0 },
  customizeHero: { display: "flex", alignItems: "center", gap: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, marginBottom: 24 },
  customizeTitle: { fontSize: 26, margin: "0 0 8px", color: "#e8a430", fontStyle: "italic" },
  customizeDesc: { color: "#9a8c7a", margin: 0, fontSize: 14 },
  optionSection: { marginBottom: 28 },
  optionLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#f5f0e8" },
  toppingNote: { fontSize: 12, color: "#6a5a4a", marginLeft: 8, fontWeight: "normal" },
  sizeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  sizeBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 8px", cursor: "pointer", color: "#f5f0e8", textAlign: "center" },
  sizeBtnActive: { background: "rgba(232,167,48,0.15)", borderColor: "#e8a430" },
  sizeName: { fontWeight: "bold", fontSize: 14 },
  sizeInches: { color: "#9a8c7a", fontSize: 12, marginTop: 2 },
  sizePrice: { color: "#e8a430", fontSize: 12, marginTop: 4 },
  crustGrid: { display: "flex", flexWrap: "wrap", gap: 10 },
  crustBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: "#f5f0e8", fontSize: 14 },
  crustBtnActive: { background: "rgba(232,71,42,0.2)", borderColor: "#e8472a", color: "#e8472a" },
  toppingGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  toppingBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 14px", cursor: "pointer", color: "#9a8c7a", fontSize: 13 },
  toppingBtnActive: { background: "rgba(232,167,48,0.15)", borderColor: "#e8a430", color: "#e8a430" },
  addToCartBar: { display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0, background: "#0f0d0a", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 16 },
  itemTotalLabel: { fontSize: 20, color: "#e8a430" },
  primaryBtn: { background: "#e8472a", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: "bold", cursor: "pointer" },
  cartWrap: { padding: "24px", maxWidth: 600, margin: "0 auto" },
  cartItem: { display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.08)" },
  cartItemName: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  cartItemDetails: { color: "#9a8c7a", fontSize: 13 },
  cartItemPrice: { fontWeight: "bold", color: "#e8a430", fontSize: 18, minWidth: 64, textAlign: "right" },
  removeBtn: { background: "none", border: "none", color: "#6a5a4a", cursor: "pointer", fontSize: 16, padding: "4px 8px" },
  cartSummary: { background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, marginTop: 16, border: "1px solid rgba(255,255,255,0.08)" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#9a8c7a", fontSize: 15 },
  totalRow: { color: "#f5f0e8", fontSize: 20, fontWeight: "bold", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 8, paddingTop: 12 },
  emptyCart: { textAlign: "center", padding: "60px 0", color: "#6a5a4a" },
  chatWrap: { display: "flex", flexDirection: "column", height: "calc(100vh - 58px)" },
  chefBanner: { display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", background: "rgba(232,71,42,0.08)", borderBottom: "1px solid rgba(232,71,42,0.2)", position: "relative" },
  chefAvatar: { fontSize: 36 },
  chefName: { fontWeight: "bold", fontSize: 16, color: "#f5f0e8" },
  chefRole: { color: "#9a8c7a", fontSize: 12 },
  onlineDot: { position: "absolute", right: 24, width: 10, height: 10, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 8px #2ecc71" },
  chatMessages: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 },
  aiBubble: { display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "80%" },
  userBubble: { display: "flex", justifyContent: "flex-end", alignSelf: "flex-end", maxWidth: "80%" },
  bubbleAvatar: { fontSize: 24, flexShrink: 0, marginTop: 2 },
  aiText: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6, color: "#f5f0e8" },
  userText: { background: "#e8472a", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6, color: "white" },
  chatInputRow: { display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,13,10,0.98)" },
  chatInput: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#f5f0e8", fontSize: 15, outline: "none" },
  sendBtn: { background: "#e8472a", border: "none", borderRadius: 12, width: 48, height: 48, color: "white", fontSize: 20, cursor: "pointer", fontWeight: "bold" },
  confirmScreen: { minHeight: "100vh", background: "#0f0d0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  confirmBox: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 400, width: "100%" },
  confEmoji: { fontSize: 72, marginBottom: 16 },
  confTitle: { fontSize: 36, fontStyle: "italic", color: "#e8a430", margin: "0 0 12px", fontFamily: "Georgia, serif" },
  confSub: { color: "#9a8c7a", marginBottom: 20, fontSize: 15 },
  confTime: { background: "rgba(232,167,48,0.1)", border: "1px solid rgba(232,167,48,0.3)", borderRadius: 10, padding: "12px 20px", color: "#e8a430", fontSize: 16, marginBottom: 12 },
  confOrder: { color: "#6a5a4a", fontSize: 13, marginBottom: 28 },
  confBtn: { background: "#e8472a", color: "white", border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 16, fontWeight: "bold", cursor: "pointer" },
};
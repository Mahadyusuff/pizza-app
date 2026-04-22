import { useState, useEffect, useRef } from "react";

const PIZZAS = [
    { id: 1, name: "Margherita Classica", price: 14.99, desc: "San Marzano tomatoes, fresh mozzarella, basil", emoji: "🍕", tags: ["vegetarian", "classic"], color: "#e8472a" },
    { id: 2, name: "Pepperoni Fuoco", price: 17.99, desc: "Spicy pepperoni, mozzarella, fiery tomato sauce", emoji: "🔥", tags: ["spicy", "meat"], color: "#c0392b" },
    { id: 3, name: "Truffle Bianca", price: 22.99, desc: "White sauce, truffle oil, arugula, parmesan", emoji: "🌿", tags: ["vegetarian", "gourmet"], color: "#2c7a3a" },
    { id: 4, name: "BBQ Smokehouse", price: 19.99, desc: "Pulled pork, smoked bacon, BBQ drizzle, red onion", emoji: "🥩", tags: ["meat", "smoky"], color: "#8B4513" },
    { id: 5, name: "Quattro Formaggi", price: 18.99, desc: "Mozzarella, gorgonzola, fontina, parmesan", emoji: "🧀", tags: ["vegetarian", "cheese"], color: "#d4a017" },
    { id: 6, name: "Neptune's Catch", price: 24.99, desc: "Shrimp, calamari, clams, garlic, olive oil", emoji: "🦐", tags: ["seafood", "gourmet"], color: "#1a6b8a" },
];

const SIZES = [
    { id: "s", label: "Small", inches: '10"', multiplier: 0.8 },
    { id: "m", label: "Medium", inches: '12"', multiplier: 1.0 },
    { id: "l", label: "Large", inches: '14"', multiplier: 1.25 },
    { id: "xl", label: "XL", inches: '16"', multiplier: 1.5 },
];

const CRUST = ["Classic", "Thin & Crispy", "Stuffed", "Gluten-Free"];

const EXTRA_TOPPINGS = ["Mushrooms", "Jalapeños", "Olives", "Anchovies", "Roasted Peppers", "Spinach", "Sun-dried Tomatoes", "Prosciutto"];

function callClaude(messages, systemPrompt) {
    return fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages }),
    }).then((r) => r.json());
}

export default function PizzaApp() {
    const [screen, setScreen] = useState("menu");
    const [selected, setSelected] = useState(null);
    const [size, setSize] = useState("m");
    const [crust, setCrust] = useState("Classic");
    const [toppings, setToppings] = useState([]);
    const [cart, setCart] = useState([]);
    const [chatMsgs, setChatMsgs] = useState([{ role: "assistant", content: "Ciao! 👨‍🍳 I'm Chef Marco, your personal pizza advisor. Ask me anything!" }]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [aiRec, setAiRec] = useState(null);
    const [recLoading, setRecLoading] = useState(false);
    const [estimatedTime] = useState(Math.floor(Math.random() * 10) + 20);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

    const getAIRecommendation = async () => {
        setRecLoading(true); setAiRec(null);
        const data = await callClaude([{ role: "user", content: "Give me a short enthusiastic pizza recommendation. Pick one from: Margherita Classica, Pepperoni Fuoco, Truffle Bianca, BBQ Smokehouse, Quattro Formaggi, Neptune's Catch. Include a reason and emoji. Under 2 sentences." }], "You are an enthusiastic Italian chef named Marco. Be warm, brief, and passionate about pizza.");
        setRecLoading(false);
        if (data.content?.[0]?.text) setAiRec(data.content[0].text);
    };

    const sendChat = async () => {
        if (!chatInput.trim()) return;
        const userMsg = { role: "user", content: chatInput };
        const newMsgs = [...chatMsgs, userMsg];
        setChatMsgs(newMsgs); setChatInput(""); setChatLoading(true);
        const data = await callClaude(newMsgs.map((m) => ({ role: m.role, content: m.content })), `You are Chef Marco at Fornaio Napoletano. Menu: ${PIZZAS.map((p) => `${p.name} ($${p.price}) - ${p.desc}`).join("; ")}. Be helpful and passionate.`);
        setChatLoading(false);
        if (data.content?.[0]?.text) setChatMsgs((prev) => [...prev, { role: "assistant", content: data.content[0].text }]);
    };

    const addToCart = () => {
        const sizeObj = SIZES.find((s) => s.id === size);
        setCart((prev) => [...prev, { id: Date.now(), pizza: selected, size: sizeObj, crust, toppings, price: selected.price * sizeObj.multiplier + toppings.length * 1.5 }]);
        setScreen("menu"); setToppings([]); setSize("m"); setCrust("Classic");
    };

    const total = cart.reduce((s, i) => s + i.price, 0);

    if (screen === "confirm") return (
        <div style={styles.confirmScreen}>
            <div style={styles.confirmBox}>
                <div style={{ fontSize: 72 }}>🎉</div>
                <h1 style={styles.confTitle}>Order Placed!</h1>
                <p style={{ color: "#9a8c7a" }}>Your pizza is in the oven at Fornaio Napoletano.</p>
                <div style={styles.confTime}>⏱ Est. delivery: {estimatedTime}–{estimatedTime + 5} min</div>
                <div style={{ color: "#6a5a4a", fontSize: 13, marginBottom: 28 }}>Order #FN-{Math.floor(Math.random() * 9000) + 1000}</div>
                <button style={styles.primaryBtn} onClick={() => setScreen("menu")}>Order Again</button>
            </div>
        </div>
    );

    if (screen === "chat") return (
        <div style={styles.root}>
            <Header cart={cart} setScreen={setScreen} screen="chat" />
            <div style={styles.chatWrap}>
                <div style={styles.chefBanner}>
                    <span style={{ fontSize: 36 }}>👨‍🍳</span>
                    <div><div style={{ fontWeight: "bold", fontSize: 16 }}>Chef Marco</div><div style={{ color: "#9a8c7a", fontSize: 12 }}>Personal Pizza Advisor · AI Powered</div></div>
                    <div style={styles.onlineDot} />
                </div>
                <div style={styles.chatMessages}>
                    {chatMsgs.map((m, i) => (
                        <div key={i} style={m.role === "user" ? styles.userBubble : styles.aiBubble}>
                            {m.role === "assistant" && <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>👨‍🍳</span>}
                            <div style={m.role === "user" ? styles.userText : styles.aiText}>{m.content}</div>
                        </div>
                    ))}
                    {chatLoading && <div style={styles.aiBubble}><span style={{ fontSize: 24 }}>👨‍🍳</span><div style={styles.aiText}>●●●</div></div>}
                    <div ref={chatEndRef} />
                </div>
                <div style={styles.chatInputRow}>
                    <input style={styles.chatInput} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Ask about ingredients, allergens, recommendations…" />
                    <button style={styles.sendBtn} onClick={sendChat} disabled={chatLoading}>↑</button>
                </div>
            </div>
        </div>
    );

    if (screen === "cart") return (
        <div style={styles.root}>
            <Header cart={cart} setScreen={setScreen} screen="cart" />
            <div style={styles.cartWrap}>
                <h2 style={styles.sectionTitle}>Your Order</h2>
                {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#6a5a4a" }}>
                        <div style={{ fontSize: 60 }}>🛒</div><p>Your cart is empty!</p>
                        <button style={styles.primaryBtn} onClick={() => setScreen("menu")}>Browse Menu</button>
                    </div>
                ) : (
                    <>
                        {cart.map((item) => (
                            <div key={item.id} style={styles.cartItem}>
                                <div style={{ fontSize: 36 }}>{item.pizza.emoji}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>{item.pizza.name}</div>
                                    <div style={{ color: "#9a8c7a", fontSize: 13 }}>{item.size.label} · {item.crust}{item.toppings.length > 0 && ` · +${item.toppings.join(", ")}`}</div>
                                </div>
                                <div style={{ fontWeight: "bold", color: "#e8a430", fontSize: 18, minWidth: 64, textAlign: "right" }}>${item.price.toFixed(2)}</div>
                                <button style={{ background: "none", border: "none", color: "#6a5a4a", cursor: "pointer", fontSize: 16, padding: "4px 8px" }} onClick={() => setCart((c) => c.filter((i) => i.id !== item.id))}>✕</button>
                            </div>
                        ))}
                        <div style={styles.cartSummary}>
                            <div style={styles.summaryRow}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                            <div style={styles.summaryRow}><span>Delivery</span><span>$2.99</span></div>
                            <div style={styles.summaryRow}><span>Tax</span><span>${(total * 0.08).toFixed(2)}</span></div>
                            <div style={{ ...styles.summaryRow, color: "#f5f0e8", fontSize: 20, fontWeight: "bold", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 8, paddingTop: 12 }}>
                                <span>Total</span><span>${(total + 2.99 + total * 0.08).toFixed(2)}</span>
                            </div>
                            <button style={styles.primaryBtn} onClick={() => { setScreen("confirm"); setCart([]); }}>Place Order 🍕</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    if (screen === "customize") {
        const sizeObj = SIZES.find((s) => s.id === size);
        const itemTotal = selected.price * sizeObj.multiplier + toppings.length * 1.5;
        return (
            <div style={styles.root}>
                <Header cart={cart} setScreen={setScreen} screen="customize" />
                <div style={styles.cartWrap}>
                    <button style={{ background: "none", border: "none", color: "#9a8c7a", cursor: "pointer", fontSize: 15, marginBottom: 20, padding: 0 }} onClick={() => setScreen("menu")}>← Back</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
                        <div style={{ fontSize: 72 }}>{selected.emoji}</div>
                        <div><h2 style={{ fontSize: 26, margin: "0 0 8px", color: "#e8a430", fontStyle: "italic" }}>{selected.name}</h2><p style={{ color: "#9a8c7a", margin: 0, fontSize: 14 }}>{selected.desc}</p></div>
                    </div>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#f5f0e8" }}>Size</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                            {SIZES.map((s) => (
                                <button key={s.id} style={{ background: size === s.id ? "rgba(232,167,48,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${size === s.id ? "#e8a430" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", color: "#f5f0e8", textAlign: "center" }} onClick={() => setSize(s.id)}>
                                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{s.label}</div>
                                    <div style={{ color: "#9a8c7a", fontSize: 12 }}>{s.inches}</div>
                                    <div style={{ color: "#e8a430", fontSize: 12 }}>+${((s.multiplier - 1) * selected.price).toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#f5f0e8" }}>Crust</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {CRUST.map((c) => (
                                <button key={c} style={{ background: crust === c ? "rgba(232,71,42,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${crust === c ? "#e8472a" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: crust === c ? "#e8472a" : "#f5f0e8", fontSize: 14 }} onClick={() => setCrust(c)}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#f5f0e8" }}>Extra Toppings <span style={{ fontSize: 12, color: "#6a5a4a", marginLeft: 8, fontWeight: "normal" }}>$1.50 each</span></div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {EXTRA_TOPPINGS.map((t) => {
                                const active = toppings.includes(t);
                                return <button key={t} style={{ background: active ? "rgba(232,167,48,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "#e8a430" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", color: active ? "#e8a430" : "#9a8c7a", fontSize: 13 }} onClick={() => setToppings((prev) => active ? prev.filter((x) => x !== t) : [...prev, t])}>{active ? "✓ " : ""}{t}</button>;
                            })}
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0, background: "#0f0d0a", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ fontSize: 20, color: "#e8a430" }}>Total: <strong>${itemTotal.toFixed(2)}</strong></div>
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
                <div style={{ maxWidth: 400 }}>
                    <div style={{ background: "rgba(232,167,48,0.15)", color: "#e8a430", display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 13, marginBottom: 12, border: "1px solid rgba(232,167,48,0.3)" }}>🍕 Napoletana Since 1987</div>
                    <h1 style={{ fontSize: "clamp(36px, 8vw, 64px)", lineHeight: 1.05, margin: "0 0 12px", color: "#f5f0e8", fontStyle: "italic" }}>Fornaio<br />Napoletano</h1>
                    <p style={{ color: "#9a8c7a", fontSize: 16, margin: 0 }}>Wood-fired perfection, delivered to your door.</p>
                </div>
                <div style={{ fontSize: "clamp(60px, 15vw, 120px)", filter: "drop-shadow(0 0 30px #e8472a)" }}>🔥</div>
            </div>
            <div style={{ padding: "24px 24px 0" }}>
                <div style={{ background: "rgba(232,167,48,0.06)", border: "1px solid rgba(232,167,48,0.2)", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "#e8a430", fontWeight: "bold", fontSize: 15 }}>
                        <span>✨ AI Chef's Pick</span>
                        <button style={{ background: "#e8a430", border: "none", color: "#0f0d0a", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 }} onClick={getAIRecommendation} disabled={recLoading}>{recLoading ? "Thinking…" : "Ask Chef Marco"}</button>
                    </div>
                    {recLoading && <div style={{ color: "#9a8c7a", fontStyle: "italic" }}>Chef Marco is thinking… 🍷</div>}
                    {aiRec && <div style={{ color: "#f5f0e8", lineHeight: 1.6 }}>{aiRec}</div>}
                    {!aiRec && !recLoading && <div style={{ color: "#6a5a4a", fontSize: 14, fontStyle: "italic" }}>Click "Ask Chef Marco" for a personalized AI recommendation.</div>}
                </div>
            </div>
            <div style={{ padding: "32px 24px" }}>
                <h2 style={styles.sectionTitle}>Our Menu</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {PIZZAS.map((p) => (
                        <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelected(p); setScreen("customize"); }}>
                            <div style={{ height: 4, background: p.color }} />
                            <div style={{ fontSize: 48, padding: "20px 20px 8px", display: "block" }}>{p.emoji}</div>
                            <div style={{ fontSize: 18, fontWeight: "bold", padding: "0 20px 6px", color: "#f5f0e8" }}>{p.name}</div>
                            <div style={{ fontSize: 13, color: "#9a8c7a", padding: "0 20px 16px", lineHeight: 1.5 }}>{p.desc}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                                <span style={{ color: "#e8a430", fontWeight: "bold", fontSize: 16 }}>from ${p.price.toFixed(2)}</span>
                                <span style={{ color: "#4a3a2a", fontSize: 11 }}>{p.tags.map((t) => `#${t}`).join(" ")}</span>
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
            <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#f5f0e8" }} onClick={() => setScreen("menu")}>
                <span style={{ fontSize: 24 }}>🍕</span>
                <span style={{ fontSize: 20, fontWeight: "bold", letterSpacing: "0.05em", color: "#e8a430" }}>Fornaio</span>
            </button>
            <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={{ ...styles.navBtn, ...(screen === "chat" ? styles.navActive : {}) }} onClick={() => setScreen("chat")}>👨‍🍳 Chef</button>
                <button style={{ ...styles.navBtn, ...(screen === "cart" ? styles.navActive : {}) }} onClick={() => setScreen("cart")}>
                    🛒 {cart.length > 0 && <span style={{ background: "#e8a430", color: "#0f0d0a", borderRadius: "50%", padding: "1px 6px", fontSize: 11, fontWeight: "bold", marginLeft: 4 }}>{cart.length}</span>}
                </button>
            </nav>
        </header>
    );
}

const styles = {
    root: { minHeight: "100vh", background: "#0f0d0a", color: "#f5f0e8", fontFamily: "'Georgia', 'Times New Roman', serif", paddingBottom: 80 },
    header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(15,13,10,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" },
    navBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f5f0e8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14, position: "relative" },
    navActive: { background: "#e8472a", borderColor: "#e8472a" },
    hero: { background: "linear-gradient(135deg, #1a0f00 0%, #2d1500 50%, #0f0d0a 100%)", padding: "60px 24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(232,167,48,0.2)" },
    sectionTitle: { fontSize: 28, fontStyle: "italic", marginBottom: 20, color: "#e8a430", borderBottom: "1px solid rgba(232,167,48,0.2)", paddingBottom: 12 },
    chatFab: { position: "fixed", bottom: 24, right: 24, background: "#e8472a", color: "white", border: "none", borderRadius: 50, padding: "14px 20px", fontSize: 15, fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 24px rgba(232,71,42,0.5)", zIndex: 200 },
    primaryBtn: { background: "#e8472a", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: "bold", cursor: "pointer", marginTop: 16 },
    cartWrap: { padding: "24px", maxWidth: 600, margin: "0 auto" },
    cartItem: { display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.08)" },
    cartSummary: { background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 20, marginTop: 16, border: "1px solid rgba(255,255,255,0.08)" },
    summaryRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#9a8c7a", fontSize: 15 },
    chatWrap: { display: "flex", flexDirection: "column", height: "calc(100vh - 58px)" },
    chefBanner: { display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", background: "rgba(232,71,42,0.08)", borderBottom: "1px solid rgba(232,71,42,0.2)", position: "relative" },
    onlineDot: { position: "absolute", right: 24, width: 10, height: 10, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 8px #2ecc71" },
    chatMessages: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 },
    aiBubble: { display: "flex", gap: 10, alignItems: "flex-start", maxWidth: "80%" },
    userBubble: { display: "flex", justifyContent: "flex-end", alignSelf: "flex-end", maxWidth: "80%" },
    aiText: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6, color: "#f5f0e8" },
    userText: { background: "#e8472a", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6, color: "white" },
    chatInputRow: { display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,13,10,0.98)" },
    chatInput: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#f5f0e8", fontSize: 15, outline: "none" },
    sendBtn: { background: "#e8472a", border: "none", borderRadius: 12, width: 48, height: 48, color: "white", fontSize: 20, cursor: "pointer", fontWeight: "bold" },
    confirmScreen: { minHeight: "100vh", background: "#0f0d0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    confirmBox: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 400, width: "100%" },
    confTitle: { fontSize: 36, fontStyle: "italic", color: "#e8a430", margin: "0 0 12px", fontFamily: "Georgia, serif" },
    confTime: { background: "rgba(232,167,48,0.1)", border: "1px solid rgba(232,167,48,0.3)", borderRadius: 10, padding: "12px 20px", color: "#e8a430", fontSize: 16, marginBottom: 12 },
};
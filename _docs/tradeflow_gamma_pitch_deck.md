# TradeFlow AI – Gamma Pitch Deck (3–5 Minutes)

---

## 🟧 Slide 1: The Problem – The Back Office Doesn’t Exist

**Heading:**  
“Solo contractors lose 2+ hours daily to admin.”

**Body Text:**  
- No dispatcher. No back office. Just you.  
- Time lost to scheduling, routing, and inventory kills revenue.  
- Existing tools? Too bloated. Too expensive. Not built for you.

**Spoken (Josh):**  
> TradeFlow isn’t built to be flashy — it’s built to be useful.  
> For the plumber, the electrician, the handyman running a solo business… this is the back office they’ve never had.

---

## 🟧 Slide 2: AI Planning in Two Taps

**Heading:**  
“Two AI agents. One seamless daily plan.”

**Body Text:**  
- The Dispatcher: prioritizes & optimizes routes (GPT-4o)  
- The Inventory Specialist: checks tools & adds store stops  
- Fully offline-capable, open source  

**Code:**  
```ts
await DispatcherAgent.execute(context)
```

**Spoken (Jeremiah):**  
> One tap triggers the **Dispatcher Agent**, which sorts and routes your jobs using GPT-4o spatial reasoning.  
> The **Inventory Specialist** then checks what tools you need and adds a hardware store stop if you're missing anything.

---

## 🟧 Slide 3: GPT-4o Powered Route Optimization

**Heading:**  
“Smarter routes. Faster jobs. Home on time.”

**Body Text:**  
- Uses OpenAI spatial reasoning  
- No API fees, no OSRM/VROOM  
- Recalculates instantly when jobs change  

**Table:**  
`routes` – `job_order`, `estimated_time`, `start/end location`

**Spoken (Jeremiah):**  
> No OSRM, no VROOM — just GPT-4o.  
> It builds a closed loop optimized for your priorities and locations, so you spend less time driving and more time working.

---

## 🟧 Slide 4: Inventory Intelligence

**Heading:**  
“You’ll never show up unprepared again.”

**Body Text:**  
- Auto-generates shopping lists  
- Checks real inventory vs. job BoMs  
- Inserts hardware stops into your day  

**Code:**  
```ts
await InventoryAgent.execute(context)
```

**Spoken (Trevor):**  
> Based on the day’s jobs, we generate a **Bill of Materials**, compare it with your on-hand inventory, and calculate what you’ll need.  
> Then we insert a **hardware store stop** at the optimal spot — all automatically.

---

## 🟧 Slide 5: One UI Built for the Field

**Heading:**  
“Built for boots-on-the-ground users.”

**Body Text:**  
- Hands-free navigation (Apple, Google, Waze, etc.)  
- Job checklists with part logging  
- Works offline and syncs when reconnected  

**Table:**  
`job_status`, `inventory_usage`

**Spoken (Josh):**  
> The UI works offline, even with gloves.  
> Tap into job details, navigate with your preferred app, check off what you used — and all of it syncs automatically.

---

## 🟧 Slide 6: Personalized Autonomy Sliders

**Heading:**  
“AI that fits how you work.”

**Body Text:**  
- Work hours, job buffers, priority rules  
- Real-time updates to AI agent behavior  
- Controlled from settings anytime  

**Table:**  
`user_preferences`

**Spoken (Jack):**  
> You don’t adapt to the AI — it adapts to you.  
> Set your hours, travel buffers, even which hardware store you prefer. Your plan reflects how **you** want to work.

---

## 🟧 Slide 7: Dynamic Replanning in the Field

**Heading:**  
“Things change. So does your plan.”

**Body Text:**  
- Real-time replanning with a single tap  
- Offline support, automatic resume  
- Keeps completed jobs intact  

**Code:**  
```ts
useRealtimeSync(planId)
```

**Spoken (Jack):**  
> If a job gets canceled mid-day, we give you the option to replan immediately.  
> And since we support full offline mode, you never lose progress — no matter the signal.

---

## 🟧 Slide 8: Built for Scale. Free Forever.

**Heading:**  
“Free. Open Source. Ready for Production.”

**Body Text:**  
- 17+ production-grade tables  
- MIT license — free forever  
- No vendor lock-in, no usage caps  

**Code:**  
```bash
git clone tradeflow
```

**Spoken (Trevor):**  
> TradeFlow is fully open source, MIT licensed, and runs without paid APIs.  
> You can deploy it yourself — or join our hosted version when it launches.

---

## 🟧 Slide 9: Real User-Centric Innovation

**Heading:**  
“Every decision makes the AI smarter.”

**Body Text:**  
- Learns from plan edits  
- Uses in-context feedback  
- Improves job order and part predictions  

**Table:**  
`user_feedback_events`, `agent_decision_contexts`

**Spoken (Jeremiah):**  
> Every time you reorder jobs, skip a part, or reroute — the AI learns.  
> We log that feedback and use it to improve your next plan automatically.

---

## 🟧 Slide 10: The Vision

**Heading:**  
“AI for the Trades. Agency for the Independents.”

**Body Text:**  
- Built for the 15M+ solo contractors in North America  
- 2+ hours saved daily = $100–300 more revenue per day  
- Building an open ecosystem of plugins and contributors  

**Spoken (Josh):**  
> TradeFlow isn’t just a scheduling tool.  
> It’s a step toward democratizing AI — giving control, time, and margin back to the people who actually make things work.

# TradeFlow AI – Gamma Presentation Deck (Updated)

---

## Slide 1: Title Slide
**Title:** TradeFlow AI  
**Subtitle:** AI-Powered Autonomy for Vocational Entrepreneurs  
**Visual:** Logo with gradient background  
**Spoken By:** Josh  
**GIF Placeholder:** N/A

---

## Slide 2: AI Planning in Two Taps
**Title:** One Tap. Instant Dispatch.  
**GIF:** Phone simulator showing “Plan My Day” button being tapped and job list prioritized  
**Code Block:**
```ts
await DispatcherAgent.execute({
  userId: "contractor-123",
  jobIds: ["job-1", "job-2", "job-3"],
  planDate: "2025-01-15"
})
```
**Spoken By:** Jeremiah  
**Database Snippet:** `dispatcher_output` object showing prioritized jobs

---

## Slide 3: GPT-4o Route Optimization
**Title:** Routes Optimized. Profits Maximized.  
**GIF:** Map updates with job pins and animated route loop  
**Table Reference:**
```sql
CREATE TABLE public.routes (
  id UUID PRIMARY KEY,
  user_id UUID,
  waypoints JSONB[],
  total_duration INTEGER,
  optimization_data JSONB
);
```
**Spoken By:** Jack

---

## Slide 4: Inventory Intelligence
**Title:** Know What You Need — Before You Leave  
**GIF:** Inventory agent adds a Home Depot stop and compiles shopping list  
**Code Snippet:**
```ts
const inventoryResult = await InventoryAgent.execute({
  userId: "contractor-123",
  jobIds: [...],
  dispatchOutput: dispatchResult
});
```
**Spoken By:** Jeremiah  
**Database Snippet:** shopping list + hardware store job insert

---

## Slide 5: One UI Built for the Field
**Title:** Designed for Gloves. Built for Speed.  
**GIF:** Tapping “Start Job”, logging parts used, marking complete  
**Tables:**
- `job_locations`
- `inventory_movements`
**Spoken By:** Jack

---

## Slide 6: Personalized Autonomy Sliders
**Title:** Autonomy You Control  
**GIF:** User sets work hours, job buffer time, supplier prefs  
**DB JSON Example:**
```json
"preferences": {
  "work_start_time": "08:00",
  "job_duration_buffer_minutes": 15,
  "preferred_suppliers": ["home_depot"]
}
```
**Spoken By:** Josh

---

## Slide 7: Dynamic Replanning in the Field
**Title:** Plans Change. We Keep Up.  
**GIF:** Job canceled mid-day → automatic replanning  
**Code:**
```ts
useEffect(() => {
  supabase.channel(`daily_plan_${planId}`).on(...);
}, [planId]);
```
**Spoken By:** Jeremiah

---

## Slide 8: Built to Scale. Free to Use.
**Title:** MIT Licensed. Launch in Minutes.  
**GIF:** Terminal running clone → install → supabase init  
**Code Block:**
```bash
git clone https://github.com/tradeflow-ai/mobile.git
npm install && npx supabase init && npm start
```
**Spoken By:** Trevor

---

## Slide 9: Real User Feedback Loop
**Title:** Learning From Every Click  
**GIF:** User reorders jobs → feedback log saved → AI adjusted  
**Table Structure:**
```sql
CREATE TABLE public.user_feedback_events (...);
CREATE TABLE public.agent_decision_contexts (...);
```
**Spoken By:** Josh

---

## Slide 10: Closing Slide – The Mission
**Title:** AI for Trades. Agency for the Independents.  
**Visual:** Looping background of field workers using app  
**Tagline:** *"TradeFlow empowers the builders of America to run smarter businesses — solo."*  
**Spoken By:** All team members

---
# W-scenarios: people using ADE, told as short scenarios

Status: **Approved** (owner, 2026-11-28: "approve", the four scenarios and the names rule as written; the closing line
added on the owner's words "Human runs the connection, and runs execution and support with AI agents"). Risk: **low** (copy and tests on the public site; no
secret, sign-in, data or money).
Verification: the repo's verification command (README.md).
Owner's words (2026-11-28): "add a scenario: 1) Jan got hired as a Software Engineer at a company, 2) Jan setup ADE to
build a Software Engineer persona as his own copilot. 3) Jan uses ADE daily to do engineering tasks, etc...", then
"add these to the site", "such scenarios", "Jan can run his task thru his phone", "Jan is providing
value to his company and customers", "Alvin scenario a new Hands-on CTO", "Robert runs a one-man software engineering and
consultancy service".

## Where
A new home-page section `#scenarios`, after `#persona` ("The brain") and before `#computer`. Kicker "Scenarios", h2
"How people use ADE.", one card per scenario, each with its numbered steps. The same words go into
`docs/messaging.md` first (the site takes its copy from there).

## The scenarios (the owner approves these words)

**Jan, a new software engineer**
1. **Hired.** Jan joins a company as a software engineer.
2. **Sets up a copilot.** `ade hub new` with the staff software engineer persona: Jan's own hub, private, with the
   company's projects added by `ade project add`.
3. **Uses it daily.** A morning briefing, a focus agent per ticket, the tests as the judge of Done. Over weeks it learns
   how Jan works, with Jan's yes.
4. **Runs tasks from the phone.** Away from the desk, Jan sends a task to his own Telegram bot and gets "Done" back with
   proof: the tests passed, and a picture of the agent's screen.
5. **Delivers value.** Tickets ship reviewed and tested, so Jan gives his company and its customers more working
   software, sooner.

**Alvin, a new hands-on CTO**
1. **Takes the job.** Alvin joins a startup as its CTO and still writes code.
2. **Sets up a hub.** `ade hub new` with the fractional CTO persona: the company's projects, its architecture decisions
   and the team's rules in one private hub.
3. **Leads and builds.** Alvin writes the stories and approves them; `ade dispatch` sends them to the projects' agents,
   and each change is reviewed by its risk before it counts.
4. **Stays on top of it.** The morning briefing says what is open, waiting and stale across every project, and
   `bin/brain search` finds any past decision in seconds.

**Robert, a one-person software consultancy**
1. **Works alone.** Robert sells software engineering and consulting to several clients, with no team behind him.
2. **One hub per client.** `ade hub new` once per client, so their code, rules and secrets never mix.
3. **Gets a team's process.** Agents plan, build and review each client's work; nothing counts as done until the tests
   pass, so Robert ships what a small team would.
4. **Runs it from anywhere.** `ade dispatch` sends tasks to every client's projects at once; Robert follows them on
   Telegram and approves at the terminal.

**Sam, on call for the platform**
1. **Gets paged.** Something is wrong in production at night.
2. **Asks in plain words.** From the phone, on Sam's own Telegram bot: "check why the API is slow".
3. **Stays in control.** The DevOps/SRE persona investigates and drafts the fix; nothing touches production without
   Sam's yes.

**Closing line** (under the four cards): "In every scenario, the human runs the connection: the people, the decisions and
the yes. AI agents run the execution and the support."

## Acceptance criteria (each named by its test, tests/siteScenarios.test.ts)
1. **scenarios_section**: the home page has `#scenarios` between `#persona` and `#computer`, with four cards in this
   order (Jan's five steps, Alvin's four, Robert's four, then Sam's three), in the approved words, then the closing line.
2. **scenarios_truth**: `docs/messaging.md` has the section; siteTruth checks the page matches it, and every command
   named (`ade hub new`, `ade project add`, `ade dispatch`) and persona named (staff software engineer, fractional CTO, DevOps/SRE) is
   one that exists on `main` today.
3. **scenarios_names**: the rule "No person or customer names" in `docs/messaging.md` becomes "No customer names or
   full names; scenarios use first names only (Jan, Alvin, Robert, Sam)", and the test allows only those names.

## Out of scope
Pictures or videos per scenario, a separate page, more scenarios (later, on the owner's word).

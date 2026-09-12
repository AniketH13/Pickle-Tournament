# 🏓 Pickleball Tournament Manager — User Stories

> **Product:** Pickleball Tournament Manager  
> **Format:** Round Robin Group Stage → Knockout Bracket  
> **Role:** Admin (single user, authenticated)

---

## Epic 1 — Authentication

### US-01 · Login to the Admin Panel
**As an** admin,  
**I want to** sign in with my credentials,  
**So that** only authorized users can manage tournaments.

**Acceptance Criteria:**
- [ ] A login page is shown at `/login` before accessing any other route
- [ ] Email field accepts `picklego@admin.com`
- [ ] Password field has a show/hide toggle
- [ ] Invalid credentials show a clear error message
- [ ] On success, admin is redirected to the dashboard
- [ ] Session lasts 24 hours via HttpOnly cookie

---

### US-02 · Logout
**As an** admin,  
**I want to** log out of the system,  
**So that** my session is securely terminated.

**Acceptance Criteria:**
- [ ] Logout button is visible in the navbar when logged in
- [ ] Clicking logout clears the session cookie
- [ ] Admin is redirected to the login page
- [ ] Accessing any protected route after logout redirects to login

---

## Epic 2 — Tournament Management

### US-03 · View All Tournaments
**As an** admin,  
**I want to** see a list of all tournaments on the home page,  
**So that** I can quickly find and open a tournament.

**Acceptance Criteria:**
- [ ] Home page shows a grid of all tournament cards
- [ ] Each card displays: name, status badge, group count, team count, match count
- [ ] Status badge has distinct colors (Group Stage = cyan, Knockout = amber, Complete = green)
- [ ] Cards show creation date
- [ ] Empty state is shown when no tournaments exist
- [ ] Clicking a card navigates to the tournament detail page

---

### US-04 · Create a New Tournament
**As an** admin,  
**I want to** create a new tournament by entering team names and group count,  
**So that** the round-robin schedule is automatically generated.

**Acceptance Criteria:**
- [ ] A "Create New Tournament" button opens a modal form
- [ ] Admin enters a tournament name
- [ ] Admin selects number of groups: 2, 3, 4, 6, or 8
- [ ] Each group always has exactly **3 teams**
- [ ] Admin enters a unique name for each team (3 per group)
- [ ] All team names are required — empty names show an error
- [ ] On submit, the system automatically generates **3 round-robin matches per group** (Team1 vs Team2, Team1 vs Team3, Team2 vs Team3)
- [ ] Admin is redirected to the newly created tournament page

---

### US-05 · Delete a Tournament
**As an** admin,  
**I want to** delete a tournament,  
**So that** I can remove test or outdated tournaments.

**Acceptance Criteria:**
- [ ] Tournament and all related data (groups, teams, matches) are deleted
- [ ] Deletion cascades to all child records

---

## Epic 3 — Group Stage

### US-06 · View Group Standings
**As an** admin,  
**I want to** see live standings for each group,  
**So that** I know which team is currently leading.

**Acceptance Criteria:**
- [ ] Each group has a standings table showing: Rank, Team, Wins, Losses, Played, Point Differential
- [ ] #1 ranked team has a gold rank badge and "Leader" tag
- [ ] Standings update immediately after any match result is entered
- [ ] Tiebreaker order: Wins → Point Differential → Points Scored
- [ ] A progress bar shows how many matches are completed in the group

---

### US-07 · Navigate Between Groups
**As an** admin,  
**I want to** switch between group tabs (A, B, C…),  
**So that** I can view each group's schedule and standings independently.

**Acceptance Criteria:**
- [ ] Group tabs are shown at the top of the Group Stage view
- [ ] Completed groups show a ✓ checkmark and the leader's name
- [ ] Active tab is highlighted in lime green
- [ ] Switching tabs shows that group's standings and matches

---

### US-08 · Enter a Group Match Result
**As an** admin,  
**I want to** click on a pending match and enter the result,  
**So that** the standings update and the match is marked complete.

**Acceptance Criteria:**
- [ ] Clicking a match card opens the Match Entry Modal
- [ ] Admin selects **Match Type**: Singles (1v1) or Doubles (2v2) — radio checkbox style
- [ ] Admin selects **Score Format**: 11 Points | 15 Points (Rally) | 21 Points
- [ ] Player name inputs shown: 1 per team for Singles, 2 per team for Doubles (optional)
- [ ] Admin enters the final score for each team
- [ ] **Win-by-2 rule is enforced**: winner must reach the threshold AND lead by ≥ 2 points
- [ ] Live validation feedback shows green (valid) or red (invalid) as scores are typed
- [ ] On save, match is marked COMPLETE, standings recalculate instantly
- [ ] Winner's name is highlighted in lime green in the match card

---

### US-09 · Reset a Match Result
**As an** admin,  
**I want to** reset a completed match back to pending,  
**So that** I can correct an entry mistake.

**Acceptance Criteria:**
- [ ] Completed match modal shows a "Reset Result" button
- [ ] On reset, match returns to PENDING status, scores and winner are cleared
- [ ] Standings recalculate immediately

---

## Epic 4 — Knockout Stage

### US-10 · Advance to Knockout Stage
**As an** admin,  
**I want to** start the knockout stage when all group matches are complete,  
**So that** group winners are automatically seeded into the bracket.

**Acceptance Criteria:**
- [ ] A success banner appears when all group matches are complete
- [ ] "Start Knockout Stage" button is shown in the banner
- [ ] If any group still has pending matches, clicking the button shows an error
- [ ] On advance: the top-ranked team from each group is promoted
- [ ] Knockout bracket is auto-seeded (Group A winner, Group B winner, etc.)
- [ ] Byes are auto-assigned for non-power-of-2 group counts (e.g., 3 groups → 1 bye)
- [ ] Tournament status changes from "Group Stage" to "Knockout"
- [ ] Admin is automatically switched to the "Knockout Bracket" tab

---

### US-11 · View the Knockout Bracket
**As an** admin,  
**I want to** see a visual knockout bracket,  
**So that** I can track the tournament's progress to the final.

**Acceptance Criteria:**
- [ ] Bracket shows rounds: Quarterfinals (if 5–8 groups), Semifinals, Final
- [ ] Each match card shows: team names (with group origin), score, winner indicator
- [ ] Completed matches have a green top border
- [ ] Ready-to-play matches have a lime accent border and "Enter Result" label
- [ ] TBD slots show "TBD" in italic until a team advances
- [ ] Bye matches are visually distinct (dimmed, labeled "BYE — auto advanced")
- [ ] A legend explains the color coding

---

### US-12 · Enter a Knockout Match Result
**As an** admin,  
**I want to** click a bracket match and enter the result,  
**So that** the winner automatically advances to the next round.

**Acceptance Criteria:**
- [ ] Same Match Entry Modal as group stage (type, format, players, score)
- [ ] Win-by-2 validation enforced
- [ ] On save, winner is automatically populated into the correct slot of the next round
- [ ] The next round match becomes "ready" if both teams are now assigned
- [ ] Clicking a match with no teams assigned does nothing (not clickable)

---

### US-13 · Crown the Champion
**As an** admin,  
**I want to** see the champion highlighted when the Final match is complete,  
**So that** the tournament result is clearly communicated.

**Acceptance Criteria:**
- [ ] After the Final match is saved, a champion banner appears at the top of the bracket
- [ ] Champion banner shows: crown icon, team name, and which group they came from
- [ ] Tournament status changes to "Complete"
- [ ] The "Complete" status badge appears on the tournament card on the home page

---

## Epic 5 — Score Validation

### US-14 · Win-by-2 Score Validation
**As an** admin,  
**I want to** be prevented from entering an invalid score,  
**So that** all match results follow official pickleball scoring rules.

**Acceptance Criteria:**
- [ ] 11-point game: winner must have ≥ 11 points AND lead by ≥ 2 (e.g., 11–9 ✅, 12–10 ✅, 11–10 ❌)
- [ ] 15-point game (Rally): same rule with threshold of 15
- [ ] 21-point game: same rule with threshold of 21
- [ ] Negative scores are rejected
- [ ] Non-numeric input is rejected
- [ ] Error message is shown inline below the score inputs
- [ ] Valid scores show a green "✅ Valid score · [Team] wins" confirmation

---

## Story Map Summary

```
Authentication     → Login · Logout
Tournament Mgmt    → View List · Create · Delete
Group Stage        → View Standings · Navigate Groups · Enter Result · Reset Result
Knockout Stage     → Advance · View Bracket · Enter Result · Champion Banner
Score Validation   → Win-by-2 · Format Rules · Live Feedback
```

---

*Last updated: September 2026*

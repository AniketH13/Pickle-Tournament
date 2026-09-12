# 🏓 Pickleball Tournament Manager — API Documentation

> **Base URL:** `http://localhost:3000`  
> **Auth:** HttpOnly session cookie (`pickleball_session`) set on login  
> **Content-Type:** `application/json` for all requests/responses

---

## Authentication

### POST `/api/auth/login`
Validates admin credentials and creates a session cookie.

**Request Body**
```json
{
  "email": "picklego@admin.com",
  "password": "picklego tournamnet"
}
```

**Success Response** `200 OK`
```json
{ "success": true }
```
Sets cookie: `pickleball_session=pickleball_admin_session; HttpOnly; MaxAge=86400`

**Error Response** `401 Unauthorized`
```json
{ "error": "Invalid email or password" }
```

---

### POST `/api/auth/logout`
Clears the session cookie.

**Request Body:** _(none)_

**Success Response** `200 OK`
```json
{ "success": true }
```
Clears cookie: `pickleball_session`

---

## Tournaments

### GET `/api/tournaments`
Returns a list of all tournaments with summary counts.

**Request:** No body required

**Success Response** `200 OK`
```json
{
  "tournaments": [
    {
      "id": "clxyz123",
      "name": "Summer Open 2026",
      "status": "GROUP_STAGE",
      "createdAt": "2026-09-12T06:00:00.000Z",
      "updatedAt": "2026-09-12T07:00:00.000Z",
      "_count": { "groups": 4 },
      "groups": [
        { "_count": { "teams": 3, "matches": 3 } }
      ]
    }
  ]
}
```

**Status values:** `GROUP_STAGE` | `KNOCKOUT` | `COMPLETE`

---

### POST `/api/tournaments`
Creates a new tournament, generates round-robin matches automatically.

**Request Body**
```json
{
  "name": "Summer Open 2026",
  "groups": [
    { "name": "A", "teams": ["Team Alpha", "Team Beta", "Team Gamma"] },
    { "name": "B", "teams": ["Team Delta", "Team Echo", "Team Foxtrot"] }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Tournament display name |
| `groups` | array | ✅ | Min 2 groups |
| `groups[].name` | string | ✅ | Single letter e.g. "A", "B" |
| `groups[].teams` | string[] | ✅ | Exactly 3 team names |

**Success Response** `201 Created`
```json
{
  "tournament": {
    "id": "clxyz123",
    "name": "Summer Open 2026",
    "status": "GROUP_STAGE",
    "groups": [
      {
        "id": "grp_001",
        "name": "A",
        "groupNumber": 0,
        "teams": [
          { "id": "team_001", "name": "Team Alpha", "groupId": "grp_001" },
          { "id": "team_002", "name": "Team Beta",  "groupId": "grp_001" },
          { "id": "team_003", "name": "Team Gamma", "groupId": "grp_001" }
        ]
      }
    ]
  }
}
```

**Generates automatically:** 3 round-robin matches per group (1v2, 1v3, 2v3)

**Error Responses**

| Status | Error |
|--------|-------|
| `400` | `"Tournament name is required"` |
| `400` | `"At least 2 groups are required"` |
| `400` | `"Each group must have exactly 3 teams"` |
| `400` | `"All team names are required"` |

---

### GET `/api/tournaments/[id]`
Returns full tournament data including all groups, teams, matches, and knockout bracket.

**Path Params:** `id` — tournament ID

**Success Response** `200 OK`
```json
{
  "tournament": {
    "id": "clxyz123",
    "name": "Summer Open 2026",
    "status": "GROUP_STAGE",
    "groups": [
      {
        "id": "grp_001",
        "name": "A",
        "groupNumber": 0,
        "teams": [
          { "id": "team_001", "name": "Team Alpha" }
        ],
        "matches": [
          {
            "id": "match_001",
            "matchNumber": 1,
            "roundNumber": 1,
            "status": "COMPLETE",
            "matchType": "SINGLES",
            "scoreType": "ELEVEN",
            "team1Id": "team_001",
            "team2Id": "team_002",
            "team1": { "id": "team_001", "name": "Team Alpha" },
            "team2": { "id": "team_002", "name": "Team Beta" },
            "team1Score": 11,
            "team2Score": 7,
            "team1Player1": "John Smith",
            "team1Player2": null,
            "team2Player1": "Jane Doe",
            "team2Player2": null,
            "winnerId": "team_001",
            "winner": { "id": "team_001", "name": "Team Alpha" }
          }
        ]
      }
    ],
    "knockoutMatches": [
      {
        "id": "km_001",
        "round": "SEMIFINAL",
        "position": 1,
        "status": "PENDING",
        "matchType": "SINGLES",
        "scoreType": "ELEVEN",
        "team1Id": "team_001",
        "team2Id": "team_004",
        "team1": { "id": "team_001", "name": "Team Alpha", "group": { "name": "A" } },
        "team2": { "id": "team_004", "name": "Team Delta", "group": { "name": "B" } },
        "team1Score": null,
        "team2Score": null,
        "winnerId": null,
        "winner": null
      }
    ]
  }
}
```

**Error Response** `404 Not Found`
```json
{ "error": "Tournament not found" }
```

---

### DELETE `/api/tournaments/[id]`
Permanently deletes a tournament and all related data.

**Path Params:** `id` — tournament ID

**Success Response** `200 OK`
```json
{ "success": true }
```

---

### POST `/api/tournaments/[id]/advance`
Promotes group winners to the knockout stage and generates the bracket.

**Path Params:** `id` — tournament ID  
**Request Body:** _(none)_

**Business Logic:**
- Computes standings per group (sort: Wins → Point Diff → Points Scored)
- Seeds top team from each group into knockout bracket
- Bracket size by group count:

| Groups | Rounds Generated |
|--------|-----------------|
| 2 | Final only |
| 3–4 | Semifinals + Final (with byes if 3) |
| 5–8 | Quarterfinals + Semifinals + Final (with byes) |

- Teams with byes are auto-advanced (match marked COMPLETE)
- Tournament status changes to `KNOCKOUT`

**Success Response** `200 OK`
```json
{ "success": true }
```

**Error Responses**

| Status | Error |
|--------|-------|
| `400` | `"Group A still has 2 pending match(es)"` |
| `404` | `"Tournament not found"` |

---

## Group Matches

### PATCH `/api/matches/[id]`
Submits a result for a group stage match.

**Path Params:** `id` — match ID

**Request Body**
```json
{
  "matchType": "SINGLES",
  "scoreType": "ELEVEN",
  "team1Player1": "John Smith",
  "team1Player2": null,
  "team2Player1": "Jane Doe",
  "team2Player2": null,
  "team1Score": 11,
  "team2Score": 8
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `matchType` | string | ✅ | `SINGLES` \| `DOUBLES` |
| `scoreType` | string | ✅ | `ELEVEN` \| `FIFTEEN` \| `TWENTY_ONE` |
| `team1Player1` | string | ❌ | Player name |
| `team1Player2` | string | ❌ | Only used when `matchType=DOUBLES` |
| `team2Player1` | string | ❌ | Player name |
| `team2Player2` | string | ❌ | Only used when `matchType=DOUBLES` |
| `team1Score` | number | ✅ | Final score for team 1 |
| `team2Score` | number | ✅ | Final score for team 2 |

**Score Thresholds & Win-by-2 Rule**

| `scoreType` | Threshold | Rule |
|-------------|-----------|------|
| `ELEVEN` | 11 | Winner ≥ 11 AND lead ≥ 2 |
| `FIFTEEN` | 15 | Winner ≥ 15 AND lead ≥ 2 |
| `TWENTY_ONE` | 21 | Winner ≥ 21 AND lead ≥ 2 |

**Success Response** `200 OK`
```json
{
  "match": {
    "id": "match_001",
    "status": "COMPLETE",
    "matchType": "SINGLES",
    "scoreType": "ELEVEN",
    "team1Score": 11,
    "team2Score": 8,
    "winnerId": "team_001",
    "team1": { "id": "team_001", "name": "Team Alpha" },
    "team2": { "id": "team_002", "name": "Team Beta" },
    "winner": { "id": "team_001", "name": "Team Alpha" }
  }
}
```

**Error Responses**

| Status | Error |
|--------|-------|
| `400` | `"Winner must reach at least 11 points"` |
| `400` | `"Winner must lead by at least 2 points (win-by-2 rule)"` |
| `400` | `"Scores cannot be negative"` |
| `404` | `"Match not found"` |

---

### DELETE `/api/matches/[id]`
Resets a group match back to PENDING (clears scores, winner, player names).

**Path Params:** `id` — match ID  
**Request Body:** _(none)_

**Success Response** `200 OK`
```json
{
  "match": {
    "id": "match_001",
    "status": "PENDING",
    "team1Score": null,
    "team2Score": null,
    "winnerId": null
  }
}
```

---

## Knockout Matches

### PATCH `/api/knockout-matches/[id]`
Submits a result for a knockout match. Automatically advances the winner to the next round.

**Path Params:** `id` — knockout match ID

**Request Body** _(same structure as group match)_
```json
{
  "matchType": "DOUBLES",
  "scoreType": "TWENTY_ONE",
  "team1Player1": "Alice",
  "team1Player2": "Bob",
  "team2Player1": "Charlie",
  "team2Player2": "Diana",
  "team1Score": 21,
  "team2Score": 18
}
```

**Auto-advance Logic:**

| Completed Round | Winner advances to |
|----------------|-------------------|
| QUARTERFINAL pos 1 | SEMIFINAL pos 1, slot team1 |
| QUARTERFINAL pos 2 | SEMIFINAL pos 1, slot team2 |
| QUARTERFINAL pos 3 | SEMIFINAL pos 2, slot team1 |
| QUARTERFINAL pos 4 | SEMIFINAL pos 2, slot team2 |
| SEMIFINAL pos 1 | FINAL pos 1, slot team1 |
| SEMIFINAL pos 2 | FINAL pos 1, slot team2 |
| FINAL | Tournament status → COMPLETE |

**Success Response** `200 OK`
```json
{
  "match": {
    "id": "km_001",
    "round": "SEMIFINAL",
    "position": 1,
    "status": "COMPLETE",
    "team1Score": 21,
    "team2Score": 18,
    "winnerId": "team_001",
    "winner": { "id": "team_001", "name": "Team Alpha" }
  }
}
```

**Error Responses**

| Status | Error |
|--------|-------|
| `400` | Score validation errors (same as group matches) |
| `400` | `"Match is not ready (teams not assigned)"` |
| `404` | `"Match not found"` |

---

### DELETE `/api/knockout-matches/[id]`
Resets a knockout match and clears the winner from the next round match.

**Path Params:** `id` — knockout match ID  
**Request Body:** _(none)_

**Success Response** `200 OK`
```json
{ "success": true }
```

**Side effects:** Clears the promoted team from the next round match and resets that match to PENDING.

---

## Data Models Reference

### Enums

```typescript
TournamentStatus  = "SETUP" | "GROUP_STAGE" | "KNOCKOUT" | "COMPLETE"
MatchType         = "SINGLES" | "DOUBLES"
ScoreType         = "ELEVEN" | "FIFTEEN" | "TWENTY_ONE"
MatchStatus       = "PENDING" | "COMPLETE"
KnockoutRound     = "QUARTERFINAL" | "SEMIFINAL" | "FINAL"
```

### Score Type Labels

| Enum | Display | Threshold |
|------|---------|-----------|
| `ELEVEN` | 11 Points | 11 |
| `FIFTEEN` | 15 Points (Rally) | 15 |
| `TWENTY_ONE` | 21 Points | 21 |

---

## Error Format

All errors follow this shape:
```json
{ "error": "Human-readable error message" }
```

---

## Quick Reference

| Method | Endpoint | Action |
|--------|----------|--------|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/tournaments` | List all tournaments |
| `POST` | `/api/tournaments` | Create tournament |
| `GET` | `/api/tournaments/:id` | Get full tournament |
| `DELETE` | `/api/tournaments/:id` | Delete tournament |
| `POST` | `/api/tournaments/:id/advance` | Advance to knockout |
| `PATCH` | `/api/matches/:id` | Submit group match result |
| `DELETE` | `/api/matches/:id` | Reset group match |
| `PATCH` | `/api/knockout-matches/:id` | Submit knockout result |
| `DELETE` | `/api/knockout-matches/:id` | Reset knockout match |

---

*Last updated: September 2026*

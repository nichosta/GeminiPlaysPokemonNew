# GemPP Development Issues

Tracking development issues, edge cases, and known problems. For both human and AI agent reference.

---

## Open Issues

### ISSUE-001: Pokemon Center Escalator Elevation Bug
**Status**: Open
**Severity**: Medium
**Area**: Map/Collision Detection

**Description**:
Escalators in Pokemon Centers display incorrect walkability due to elevation handling conflicts.

**Details**:
- Escalator tiles are warp tiles with elevation 4
- Adjacent tiles above/below have elevation 3
- Tiles to the side have elevation change markers
- The game prevents walking onto escalators from above/below (due to railing graphics)
- **Problem**: Warp tile status overwrites the walkability check, making escalators appear walkable from all directions when they shouldn't be

**Expected Behavior**:
- Escalator should show as unwalkable when player is above or below it (elevation 3)
- Escalator should show as walkable (warp) when player is at correct approach angle

**Root Cause**:
Warp detection takes priority over elevation-based collision, but the game actually prevents movement based on elevation mismatches that our validation doesn't account for.

**Potential Fix**:
When checking walkability, also verify elevation compatibility. A warp tile should only be walkable if:
1. Player elevation matches or can transition to tile elevation
2. Approach direction is valid for that warp type

**Related Files** (from old project):
- `gamestate/overworld/mapDataProcessor.js`
- `gamestate/overworld/mapMetatiles.js`

---

### ISSUE-002: General Elevation Handling Problems
**Status**: Open
**Severity**: Medium
**Area**: Map/Collision Detection

**Description**:
Multiple issues with elevation system beyond escalators. Needs comprehensive documentation.

**Known Sub-issues**:
- [ ] Elevation transitions not always detected correctly
- [ ] Ledge jumping validation
- [ ] Water/surf tile elevation checks
- [ ] Bridge tiles (walkable at multiple elevations)

**Action Items**:
- Document all elevation-related edge cases as they're discovered
- Consider whether to fix in validation or handle via LLM warnings

---

## Resolved Issues

(None yet)

---

## Issue Template

```markdown
### ISSUE-XXX: [Title]
**Status**: Open | In Progress | Resolved
**Severity**: Low | Medium | High | Critical
**Area**: [Component/Package]

**Description**:
[Brief description of the issue]

**Details**:
[Detailed explanation, reproduction steps, etc.]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Root Cause**:
[If known]

**Potential Fix**:
[Ideas for resolution]

**Related Files**:
[Relevant code locations]
```

---
name: edd-red
description: "EDD Red Phase (Steps 14-16) - Real test data gate, E2E/Integration/Unit test writing (all FAILING)"
---

# EDD Red Phase (Steps 14-16)

> Phase skill for `phase-red` agent. For overview: `load skill edd-overview`.

## Delegation Pattern

- Step 14.0: **3 Haiku scouts in parallel** — check infrastructure, test data, anti-patterns
- Steps 14-16: **Alchemist (Sonnet) MODE: implement** — write test files
  - Can batch: E2E tests for independent flows in parallel

## Step Overview

| Step     | Name                    | Description                                                            | Output                 |
| -------- | ----------------------- | ---------------------------------------------------------------------- | ---------------------- |
| **14.0** | Real Test Data Gate     | Verify real test data exists before writing E2E tests                  | Verification checklist |
| **14**   | Write E2E Tests         | Feature-level tests representing user flows. **MUST BE FAILING (RED)** | E2E test files         |
| **15**   | Write Integration Tests | Service interaction tests. **MUST BE FAILING (RED)**                   | Integration test files |
| **16**   | Write Unit Tests        | Individual component tests. **MUST BE FAILING (RED)**                  | Unit test files        |

---

## Behavior Assertion Requirements (ALL Steps 14-16)

> **Read `prompts/test-template.md` before writing any test.**

Every test MUST follow the **Outcome-Effect Rule**:

| Assertion Type   | Required?    | Example                                       |
| ---------------- | ------------ | --------------------------------------------- |
| **User Outcome** | At least ONE | `assert result.url is not None`               |
| **Side Effect**  | At least ONE | `mock.method.assert_called_once()`            |
| **State Only**   | BLOCKED      | `assert len(items) > 0` alone is insufficient |

**Per-test checklist:**

- [ ] Test asserts what the USER sees/gets (outcome)
- [ ] Test asserts external system was called (side effect)
- [ ] Async methods use `AsyncMock` (Python) / `mockResolvedValue` (JS/TS)
- [ ] Mocks include call verification (`assert_called_once` / `toHaveBeenCalled`)

---

## E2E Completeness Checklist (EVO029.5)

> Before an E2E test is considered complete, verify it would **FAIL if the final stage is skipped**.

**Per E2E test:**

- [ ] Test verifies the **FINAL USER OUTPUT** (not just intermediate state)
- [ ] Test verifies the **PRIMARY SIDE EFFECT** (API call, DB write, file creation)
- [ ] Test would **FAIL** if the last design stage is removed from implementation

```python
# INCOMPLETE — only checks intermediate state
def test_playlist_creation():
    result = create_playlist("happy music")
    assert result.tracks  # Intermediate — passes even if playlist URL is never created

# COMPLETE — verifies final output + side effect
def test_playlist_creation():
    result = create_playlist("happy music")
    assert result.tracks                                    # Intermediate
    assert result.spotify_playlist_url is not None          # Final user output
    assert "spotify.com/playlist" in result.spotify_playlist_url  # Valid format
    mock_spotify.create_playlist.assert_called_once()       # Side effect verified
```

---

## Step 14.0: Real Test Data Gate (MANDATORY)

**Purpose:** STOP before writing E2E tests if real test data doesn't exist.

**Pre-Test Verification Checklist:**

```markdown
## Real Test Data Verification

### Infrastructure

- [ ] Docker services running OR local dev server operational
- [ ] Database accessible (not in-memory for prod PostgreSQL)
- [ ] External APIs reachable (real or Docker replicas)

### Test Data

- [ ] Real files exist in `tests/fixtures/` or `tests/data/`
- [ ] Files are actual artifacts (not programmatically generated)
- [ ] Test user data uses realistic values

### Code Inspection

- [ ] No `@mock.patch` decorators planned for E2E tests
- [ ] No `Image.new()` or similar generation patterns
- [ ] No `faker` library usage in E2E fixtures
```

**Red Flags - STOP if detected:**

```python
# GENERATED DATA - Always fails this gate
img = Image.new('RGB', (800, 600), color='white')
draw.text((50, 50), "Test IBAN: DE89...")

# MOCKED SERVICES - Not real E2E
@mock.patch('openai.ChatCompletion.create')
def test_extraction():
    pass

# FAKE DATA LIBRARIES - Hides real field issues
from faker import Faker
fake = Faker()
test_email = fake.email()

# IN-MEMORY DATABASE - Not production equivalent
engine = create_engine('sqlite:///:memory:')
```

**Verification Commands:**

```bash
# Check infrastructure
docker-compose ps                    # Services running?
curl http://localhost:8000/health    # API accessible?

# Check test data
ls tests/fixtures/                   # Real files exist?
file tests/fixtures/sample.pdf       # Actual file type?

# Check for anti-patterns
grep -r "@mock\|@patch" tests/e2e/   # Must be empty for E2E
grep -r "Image.new\|faker" tests/    # Should not be in E2E fixtures
```

**Gate Decision:**

| Check    | Status | Action                                   |
| -------- | ------ | ---------------------------------------- |
| All pass | PASS   | Proceed to Step 14                       |
| Any fail | FAIL   | **STOP** - Fix infrastructure/data first |

**If Gate FAILS:**

1. **DO NOT** proceed with writing E2E tests
2. **DO NOT** use mocks as "temporary solution"
3. **DO** fix infrastructure issues first
4. **DO** obtain real test data before continuing
5. **DOCUMENT** what's missing in EVO notes

**STOP POINT:** All checks must pass before writing any E2E test code.

---

## GATE: All Tests Must Be RED

```
Before proceeding to Green:
- Step 14.0 verification PASSED
- All E2E tests written and FAILING
- All Integration tests written and FAILING
- All Unit tests written and FAILING
- Test names clearly describe expected behavior
- No test should pass yet (implementation doesn't exist)
- Every test asserts User Outcome OR Side Effect (Outcome-Effect Rule)
- No state-only assertions without documented justification
- All async mocks use AsyncMock / mockResolvedValue
```

---

## Red Checklist

- [ ] **Step 14.0:** Real test data verified (infrastructure + fixtures)
- [ ] **Step 14.0:** No generated data patterns detected
- [ ] **Step 14.0:** No mocks planned for E2E tests
- [ ] **GATE:** Real Test Data Gate passed
- [ ] Step 14: E2E tests written (FAILING)
- [ ] Step 15: Integration tests written (FAILING)
- [ ] Step 16: Unit tests written (FAILING)
- [ ] **Outcome-Effect:** Every test asserts user outcome OR side effect
- [ ] **E2E Completeness:** Each E2E test verifies final user output (not just intermediate)
- [ ] **E2E Completeness:** Each E2E test would FAIL if last design stage is skipped
- [ ] **Async Mocks:** All async methods use AsyncMock / mockResolvedValue
- [ ] **GATE:** All tests RED

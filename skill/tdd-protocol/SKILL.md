---
name: tdd-protocol
description: Test-Driven Development protocol with Red-Green-Refactor Plus cycle
sections: [OVERVIEW, RED, GREEN, REFACTOR, BUDGET, SAGE]
---

# Test-Driven Development (TDD) Protocol

**TDD-First Approach**: Write tests before implementation to clarify requirements and drive design.

<!-- SECTION:OVERVIEW -->

## TDD Cycle Enhancement

### Red-Green-Refactor Plus

1. **Red**: Write failing test that captures requirement
2. **Green**: Write minimal code to pass test
3. **Refactor**: Improve design while maintaining test coverage
4. **Validate**: Ensure integration with service pattern
5. **Document**: Update docstrings and examples
<!-- /SECTION:OVERVIEW -->

<!-- SECTION:RED -->

### TDD with Service Pattern Integration

```pseudocode
// Test-first service implementation
class TestUserService:
    test_get_user_by_id_success():
        // Arrange
        user_repo = UserRepositoryStub(user=User(id="123", name="Alice"))
        service = UserService.create_null(canned_user=user_repo.get_user())

        // Act
        result = service.get_by_id("123")

        // Assert
        assert result.id == "123"
        assert result.name == "Alice"

    test_get_user_by_id_not_found():
        // Arrange
        user_repo = UserRepositoryStub(user=null)
        service = UserService.create_null(canned_user=null)

        // Act & Assert
        expect_exception(UserNotFoundException):
            service.get_by_id("999")
```

### TDD Testing Pyramid

- **Unit Tests (70%)**: Test individual service methods with stubs
- **Integration Tests (20%)**: Test service + repository integration
- **End-to-End Tests (10%)**: Test complete user workflows
<!-- /SECTION:RED -->

<!-- SECTION:GREEN -->

### TDD Quality Gates

- **Coverage Threshold**: ≥80% branch coverage, ≥90% line coverage
- **Test Performance**: Unit tests <50ms, integration tests <500ms
- **Test Reliability**: 0% flaky tests, deterministic outcomes
- **Test Maintainability**: Clear test names, minimal setup, focused assertions
<!-- /SECTION:GREEN -->

<!-- SECTION:BUDGET -->

## Test Budget Protocol

### Coverage-First Approach

- **Target**: 80% branch coverage (stop when reached)
- **Budget Formula**: `max_tests = iterations × 3 + 5`
- **Priority**: Coverage target over test count

### Budget Rules

1. **Coverage Check**: After each test, run `pytest --cov --cov-branch`
2. **Stop Condition**: When coverage ≥ 80%, stop writing tests
3. **Budget Guard**: If tests > budget AND coverage < 80%, ask user:
   ```
   Test budget exceeded (X/Y tests) but coverage only Z%.
   Options:
   - Continue with more tests (may indicate complex code)
   - Refactor code to be more testable
   - Accept current coverage for this iteration
   ```

### What NOT to Test

- **Getters/Setters**: Simple property access
- **Framework Code**: Django models, Flask routes (test integration instead)
- **Logging**: Log statements and formatters
- **Config Loading**: Environment variable reading
- **Third-party Libraries**: Mock/stub instead of testing library internals

### Coverage Calculation

```bash
# Run after each test addition
pytest --cov --cov-branch --cov-report=term-missing

# Target metrics
Branch Coverage: ≥80%
Line Coverage: ≥90% (usually achieved with 80% branch)
```

## When to Use This Skill

- Before implementing any new feature
- When fixing bugs (write test first that reproduces bug)
- When refactoring (ensure tests exist first)
- For any code that has business logic
<!-- /SECTION:BUDGET -->

---

<!-- SECTION:SAGE -->

## SAGE Integration

When used within S.A.G.E. EDD workflow:

### Test Order (Important!)

- **EDD order: E2E → Integration → Unit** (Steps 12-14)
- **Traditional TDD: Unit → Integration → E2E** (pyramid)
- Within S.A.G.E., follow EDD order for writing tests
- Pyramid ratios (70/20/10) still apply for coverage targets

### Step 17 Safety Check

**"Unexpected GREEN = Problem"**

- If tests pass before implementation is complete, investigate
- May indicate: stale test state, test isolation issues, or test not actually testing new code

### Related Skills

| Skill             | When to Load             | Relationship                                    |
| ----------------- | ------------------------ | ----------------------------------------------- |
| `edd-overview`    | Full feature development | Parent workflow (load this for 22-step context) |
| `debugging`       | Test failures            | 4-phase error resolution                        |
| `service-pattern` | Service implementation   | Service architecture patterns                   |

Cross-reference: `load skill edd-overview` for full 22-step protocol

<!-- /SECTION:SAGE -->

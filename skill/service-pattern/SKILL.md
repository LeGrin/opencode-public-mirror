---
name: service-pattern
description: Enhanced Standard Service Pattern (SSP) for observability, testability, and separation of concerns
---

# Enhanced Standard Service Pattern (SSP)

**Architecture Goal**: Achieve observability, testability, and separation of concerns through layered service design.

## Service Pattern Architecture

### Four-Tier Contract
| Layer | Responsibility | Construction | Testing Strategy |
|-------|---------------|-------------|------------------|
| `ServiceInterface` | Pure contract definition | Abstract base class | Interface compliance tests |
| `LoggedService` | Observability & metrics | Decorator pattern | Logging behavior tests |
| `ServiceStub` | Deterministic testing | In-memory fake | Stub behavior tests |
| `ServiceImpl` | Business logic & I/O | Concrete implementation | Integration tests |

### Service Interface Contract

```pseudocode
// Domain service contract with comprehensive CRUD operations
interface ServiceInterface<T, ID>:
    // Retrieve entity by ID. Returns null if not found
    get_by_id(entity_id: ID) -> Optional<T>
    
    // Create new entity. Returns created entity with ID
    create(entity: T) -> T
    
    // Update existing entity. Raises NotFound if entity doesn't exist
    update(entity: T) -> T
    
    // Delete entity by ID. Returns true if deleted, false if not found
    delete(entity_id: ID) -> Boolean
    
    // List entities with pagination
    list(limit: Integer = 100, offset: Integer = 0) -> List<T>
```

### LoggedService Implementation

```pseudocode
// Decorator that wraps ServiceImpl with observability
class LoggedService implements ServiceInterface<T, ID>:
    private service: ServiceInterface<T, ID>
    private logger: Logger
    private metrics: MetricsCollector
    
    constructor(service: ServiceInterface<T, ID>, logger: Logger):
        this.service = service
        this.logger = logger
        this.metrics = new MetricsCollector()
    
    get_by_id(entity_id: ID) -> Optional<T>:
        start_time = current_time()
        logger.info("get_by_id - started", method: "get_by_id", entity_id: entity_id)
        
        try:
            result = service.get_by_id(entity_id)
            elapsed = current_time() - start_time
            
            logger.info("get_by_id - completed", 
                method: "get_by_id", 
                duration_ms: elapsed, 
                success: true)
            
            metrics.record_execution("get_by_id", elapsed, true)
            return result
            
        catch Exception e:
            elapsed = current_time() - start_time
            logger.error("get_by_id - failed", 
                method: "get_by_id", 
                duration_ms: elapsed, 
                error: e.message)
            
            metrics.record_execution("get_by_id", elapsed, false)
            throw e
```

### ServiceStub for Testing

```pseudocode
// In-memory fake for deterministic testing
class ServiceStub implements ServiceInterface<T, ID>:
    private entities: Map<ID, T>
    private should_fail: Boolean
    private failure_exception: Exception
    private call_history: List<String>
    
    constructor(entities: Map<ID, T> = {}, should_fail: Boolean = false):
        this.entities = entities
        this.should_fail = should_fail
        this.call_history = []
    
    get_by_id(entity_id: ID) -> Optional<T>:
        call_history.add("get_by_id(" + entity_id + ")")
        
        if should_fail:
            throw failure_exception ?: RuntimeError("Simulated failure")
        
        return entities.get(entity_id)
    
    get_call_history() -> List<String>:
        return call_history.copy()
```

### ServiceImpl Implementation

```pseudocode
// Production implementation with repository pattern
class ServiceImpl implements ServiceInterface<T, ID>:
    private repository: Repository<T, ID>
    private validator: Validator<T>
    
    // Factory method for production service with logging
    static create(repository, validator, logger = null) -> ServiceInterface<T, ID>:
        logger = logger ?: Logger.getLogger(ServiceImpl.class.name)
        impl = new ServiceImpl(repository, validator)
        return new LoggedService(impl, logger)
    
    // Factory method for testing stub
    static create_null(entities = {}, should_fail = false) -> ServiceInterface<T, ID>:
        return new ServiceStub(entities, should_fail)
```

## Service Composition

```pseudocode
class OrderService:
    private user_service: ServiceInterface<User, String>
    private product_service: ServiceInterface<Product, String>
    
    create_order(user_id: String, product_ids: List<String>) -> Order:
        // Validate user exists
        user = user_service.get_by_id(user_id)
        if user == null:
            throw new UserNotFoundException(user_id)
        
        // Validate products exist
        products = product_ids.map(pid -> product_service.get_by_id(pid))
        // ... create order logic
```

## When to Use This Skill
- When creating new services with business logic
- When adding observability to existing services
- When writing unit tests for services
- When designing service composition

---

## SAGE Schema Integration

### Schema-First Service Design
When designing services within S.A.G.E. workflow:

1. **Step 3 (Interfaces & Schemas)**: Define interface in `docs/schema.yaml` FIRST
2. **Step 6 (Services Identification)**: Reference existing services from `x-services`
3. **Step 9 (Detailed Plan)**: Plan implementation with SSP pattern
4. **Step 15 (Implementation)**: Implement following SSP layers

### Schema Format for Services
```yaml
x-services:
  UserService:
    methods:
      - name: get_by_id
        input: {id: string}
        output: {user: User}
        errors: [UserNotFound]
        tested: false  # Mark true after E2E tests pass
```

### SSP Layers in Schema Context
| Layer | Schema Relationship |
|-------|---------------------|
| ServiceInterface | Defined in `x-services` |
| LoggedService | Wraps interface, logs to schema-defined format |
| ServiceStub | Uses `output` for mock data |
| ServiceImpl | Implements `methods` from schema |

See `prompts/schema-awareness.txt` for full schema protocol.

### Related Skills

| Skill | When to Load | Relationship |
|-------|--------------|--------------|
| `edd-overview` | Full feature development | Parent workflow |
| `tdd-protocol` | Test writing | TDD for service tests |
| `debugging` | Service debugging | LoggedService provides evidence |

Cross-reference: `load skill edd-overview` for full workflow context

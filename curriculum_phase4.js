/**
 * ArchLingo — Phase 4: Relational Databases, Transactions & Replication (Stages 31–40)
 * Authored with SRE rigor, Martin Kleppmann & Alex Xu depth. Zero trivial analogies.
 */

window.PHASE4_STAGES = [
  {
    id: 31,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Relational Modeling: Normalization (3NF) vs Denormalization",
    icon: "🗃️",
    company: "Shopify",
    concept: {
      beginnerGlossary: [
        {
          term: "Database Normalization (3NF)",
          plainEnglish: "Structuring database tables to eliminate duplicate redundant data by dividing information into logically distinct tables linked by Foreign Keys.",
          whyInvented: "Prevents update anomalies: if a customer changes their address, you update exactly one row in one table, eliminating inconsistent data states.",
          howItWorks: "First Normal Form (atomic values), Second Normal Form (no partial key dependencies), Third Normal Form (no transitive dependencies)."
        },
        {
          term: "Denormalization",
          plainEnglish: "Intentionally copying and embedding redundant data across tables to avoid expensive SQL multi-table JOIN operations during read queries.",
          whyInvented: "Joining 6 large tables at 100,000 QPS melts database CPUs; storing pre-computed redundant fields allows single-table O(1) reads.",
          howItWorks: "Storing 'customer_name' directly inside the 'orders' table. Requires application-level logic or database triggers to keep duplicates synchronized."
        }
      ],
      architectureCard: {
        title: "The Read vs Write Scalability Trade-Off in Schema Design",
        physicalInvariant: "SQL JOIN operations across unindexed or cross-shard tables require Cartesian nested loop scans or massive hash join buffers in RAM. Denormalization trades write complexity for instant read latency.",
        mentalModel: "Pure 3NF normalization optimizes for Write Consistency (zero redundancy, fast single-row writes). Denormalization optimizes for Read Throughput (pre-joined records, zero JOIN overhead). At cloud scale, distributed systems almost universally denormalize reads while using event-driven reconciliation (CDC) for write consistency.",
        flowSteps: [
          "1. 3NF Query: SELECT * FROM orders JOIN users JOIN products JOIN addresses (4 disk index seeks)",
          "2. Denormalized Query: SELECT * FROM order_details_view WHERE order_id = 42 (1 disk seek)",
          "3. Trade-off: When user updates address, application must update 'users' and past unfulfilled 'orders'",
          "4. Reconciliation: Async background workers or Kafka events propagate updates to denormalized tables"
        ],
        formulaTitle: "SQL Multi-Table JOIN Cost Complexity Formula",
        formulaMath: "Nested Loop Join Complexity = O(|Table_A| * log(|Table_B|))",
        formulaExplanation: "Joining a 10,000,000-row orders table with a 2,000,000-row users table without an index takes O(N*M) = 20 trillion operations! Even with indexes, multi-table joins across distributed shards create catastrophic network hop latency."
      },
      codeCard: {
        title: "Normalized vs Denormalized Schema in PostgreSQL",
        language: "sql",
        code: "-- 1. Normalized (3NF): Clean, zero redundancy, requires JOIN\nCREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));\nCREATE TABLE orders (\n    id SERIAL PRIMARY KEY, \n    user_id INT REFERENCES users(id), \n    total_cents INT\n);\n\n-- 2. Denormalized for high-speed read scale:\nCREATE TABLE order_read_model (\n    order_id INT PRIMARY KEY,\n    user_id INT,\n    user_name VARCHAR(100), -- Embedded duplicate for zero-JOIN queries\n    total_cents INT,\n    created_at TIMESTAMP\n);",
        takeaway: "In high-throughput microservices, normalize the write-path database, and project denormalized read-models asynchronously using Change Data Capture."
      },
      caseStudyCard: {
        company: "Shopify",
        incidentOrChallenge: "Rendering merchant order admin dashboards required joining 8 normalized tables across orders, line items, taxes, customers, and fulfillment, hitting database query timeouts during Black Friday.",
        solution: "Implemented an event-driven read model using Kafka: order mutations emit events that project pre-joined, denormalized JSON order documents into Elasticsearch and Redis.",
        keyMetric: "Reduced dashboard query latency from 1,200ms to 8ms and dropped core MySQL CPU utilization by 45%."
      },
      simulator: {
        param1Label: "Tables Joined in Read Query",
        param1Min: 1,
        param1Max: 8,
        param1Default: 4,
        param2Label: "Read Query Volume (QPS)",
        param2Min: 100,
        param2Max: 10000,
        param2Default: 2500
      }
    },
    questions: [
      {
        id: "s31_q1",
        question: "What is an 'Update Anomaly' that database normalization (3NF) is specifically designed to eliminate?",
        options: [
          "When a database loses power and resets all passwords",
          "When data is stored redundantly in multiple tables, updating an entity in one place but failing to update it in another leaves the database in an inconsistent, contradictory state",
          "When an SQL query contains a syntax spelling error",
          "When a column data type is changed from INT to BIGINT"
        ],
        correctAnswer: 1,
        explanation: "In an unnormalized database, if a user's address is duplicated across 50 rows in an orders table, changing the address requires updating all 50 rows. If an update fails halfway or misses a table, the customer will have two different addresses in the same system—a classic update anomaly."
      },
      {
        id: "s31_q2",
        question: "Why do large-scale distributed architectures (like sharded databases or microservices) frequently abandon pure 3NF normalization in favor of denormalization?",
        options: [
          "Because distributed databases do not support strings",
          "Multi-table SQL JOINs across distributed database shards or independent microservices require massive cross-network RPC calls and distributed locking, destroying scalability and latency SLAs",
          "Because disk storage space has become 100% free",
          "Because normalization was deprecated by the ANSI SQL committee"
        ],
        correctAnswer: 1,
        explanation: "In a sharded architecture, the 'orders' table might live on Shard 4 in Ohio, while the 'users' table lives on Shard 8 in Ireland. Performing a relational JOIN across network boundaries requires transmitting millions of rows across data centers (Scatter-Gather), introducing immense network latency and lock contention."
      },
      {
        id: "s31_q3",
        question: "What is the primary architectural penalty incurred when introducing denormalization into a database schema?",
        options: [
          "The database can no longer use B-tree indexes",
          "Write operations become more complex and expensive because multiple redundant copies of the data must be updated atomically or reconciled asynchronously across tables",
          "The operating system requires 10x more CPU cores",
          "All queries must be written in C++"
        ],
        correctAnswer: 1,
        explanation: "Denormalization trades faster reads for slower, more complicated writes. Every time an entity changes, your application or background pipeline must find and update every redundant duplicate copy across all tables. If this synchronization fails or lags, readers observe inconsistent data."
      }
    ]
  },

  {
    id: 32,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Database Indexing: Clustered vs Secondary & Covering Indexes",
    icon: "📑",
    company: "GitLab",
    concept: {
      beginnerGlossary: [
        {
          term: "Clustered Index (Primary Key Index)",
          plainEnglish: "The physical organization of the table rows on disk sorted by the primary key. The leaf pages of a clustered index ARE the actual data rows.",
          whyInvented: "Looking up a record by primary key requires zero secondary pointer hops; you land directly on the row itself in one seek.",
          howItWorks: "A table can have ONLY ONE clustered index because physical rows on disk can only be sorted in one order."
        },
        {
          term: "Covering Index (Index-Only Scan)",
          plainEnglish: "A secondary index that contains ALL columns requested by an SQL query, allowing the database to satisfy the query entirely from the index without touching table rows.",
          whyInvented: "Eliminates the expensive secondary lookup (heap fetch / bookmark lookup) to the main table data pages.",
          howItWorks: "If index covers (user_id, status) and query is `SELECT status FROM orders WHERE user_id = 5`, the engine reads the answer directly from the B-tree leaf node in memory."
        }
      ],
      architectureCard: {
        title: "Secondary Index Bookmark Lookup vs Index-Only Scan",
        physicalInvariant: "In MySQL InnoDB, secondary index leaf nodes store the Primary Key (not a physical disk pointer). A secondary lookup requires TWO B-tree traversals: 1. Search Secondary B-tree to find Primary Key, 2. Search Clustered B-tree to fetch full row!",
        mentalModel: "Every secondary index you add speeds up specific SELECT queries, but penalizes every single INSERT, UPDATE, and DELETE because all secondary B-trees must be updated and re-balanced synchronously on disk.",
        flowSteps: [
          "1. Query: SELECT email FROM users WHERE username = 'alice'",
          "2. Traversal 1: Traverse secondary B-tree index on 'username' to find Primary Key (id = 452)",
          "3. Traversal 2 (Bookmark Lookup): Traverse clustered B-tree index on 'id' to fetch row page",
          "4. Covering Optimization: If index on (username, email) existed, Traversal 2 is completely avoided!"
        ],
        formulaTitle: "Index Write Overhead Formula",
        formulaMath: "Insert Cost = 1 Clustered Insert + N Secondary Index B-Tree Inserts",
        formulaExplanation: "A table with 8 secondary indexes turns a single INSERT into 9 separate B-tree modifications, 9 separate WAL entries, and potential page splits across 9 structures."
      },
      codeCard: {
        title: "PostgreSQL Covering Index Definition (INCLUDE Clause)",
        language: "sql",
        code: "-- Create a covering index that includes 'email' without making it part of the B-tree search key\nCREATE INDEX idx_users_username_covering \nON users (username) INCLUDE (email, status);\n\n-- Verify with EXPLAIN: Should show 'Index Only Scan' with zero Heap Fetches\nEXPLAIN ANALYZE\nSELECT email, status FROM users WHERE username = 'alice';\n-- Output: Index Only Scan using idx_users_username_covering ... Heap Fetches: 0",
        takeaway: "Use the INCLUDE clause for covering indexes: it stores payload columns in the leaf nodes without bloating the internal routing keys of the B-tree."
      },
      caseStudyCard: {
        company: "GitLab",
        incidentOrChallenge: "A critical database query on the 'ci_builds' table timed out during peak CI pipeline traffic because PostgreSQL executed hundreds of thousands of heap page fetches on an unindexed column.",
        solution: "Added a covering composite B-tree index with an INCLUDE clause covering pipeline metadata, converting expensive Bitmap Heap Scans into sub-millisecond Index Only Scans.",
        keyMetric: "Reduced p99 query latency from 2,400ms to 1.8ms and eliminated database CPU saturation."
      },
      simulator: {
        param1Label: "Secondary Indexes on Table",
        param1Min: 1,
        param1Max: 12,
        param1Default: 4,
        param2Label: "Write-to-Read Ratio (%)",
        param2Min: 10,
        param2Max: 90,
        param2Default: 40
      }
    },
    questions: [
      {
        id: "s32_q1",
        question: "In MySQL InnoDB, why does looking up a row via a Secondary Index require two separate B-tree traversals (unless it is a covering index)?",
        options: [
          "Because MySQL queries are executed twice for security verification",
          "Secondary index leaf nodes store the row's Primary Key value; the engine must search the secondary B-tree to find the primary key, then search the clustered B-tree to fetch the actual table row (Bookmark Lookup)",
          "Because secondary indexes only store even-numbered IDs",
          "To allow MySQL to run on two CPU cores simultaneously"
        ],
        correctAnswer: 1,
        explanation: "InnoDB secondary indexes do not store physical memory pointers to rows (because row movements during page splits would require updating millions of secondary pointers). Instead, they store the row's Primary Key. Finding a row via a secondary index requires traversing the secondary B-tree to get the primary key, then traversing the primary clustered B-tree to fetch the row columns."
      },
      {
        id: "s32_q2",
        question: "What is an 'Index-Only Scan' (Covering Index), and why is it vastly faster than a standard indexed scan?",
        options: [
          "It deletes all table data to keep only the index in memory",
          "All columns requested in the SELECT and WHERE clauses exist directly inside the index leaf nodes; the database satisfies the entire query from the index without performing any random I/O reads against the main table data pages",
          "It searches the index using regular expressions",
          "It automatically runs on GPU hardware"
        ],
        correctAnswer: 1,
        explanation: "When an index contains all required columns (e.g. index on `(user_id, status)` for query `SELECT status FROM orders WHERE user_id = 42`), the engine extracts the data directly from the B-tree leaf node. It completely skips the 'heap fetch' / 'bookmark lookup' to the primary table, cutting disk I/O in half."
      },
      {
        id: "s32_q3",
        question: "Why should developers avoid blindly adding 15 secondary indexes to a high-volume transactional table?",
        options: [
          "PostgreSQL only allows a maximum of 3 indexes per database",
          "Every secondary index adds write overhead: every INSERT, UPDATE, or DELETE must synchronously modify and rebalance all 15 B-trees on disk, creating severe write latency and buffer pool bloat",
          "Adding indexes deletes the primary key",
          "Secondary indexes cause network packet loss"
        ],
        correctAnswer: 1,
        explanation: "Indexes are not free. While they accelerate specific SELECTs, they penalize every write. Inserting one row requires updating the clustered index plus 15 secondary B-trees, generating 16x more dirty pages, write-ahead log entries, and potential B-tree page splits."
      }
    ]
  },

  {
    id: 33,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Write-Ahead Logging (WAL) & Crash Recovery (ARIES Protocol)",
    icon: "📜",
    company: "PostgreSQL",
    concept: {
      beginnerGlossary: [
        {
          term: "Write-Ahead Log (WAL / Redo Log)",
          plainEnglish: "An append-only log on disk where every database modification is recorded BEFORE the change is applied to the actual table data pages in memory.",
          whyInvented: "Writing dirty table pages randomly to disk on every transaction is far too slow (random I/O). The WAL provides durability with fast sequential writes.",
          howItWorks: "The database appends the change to the WAL, calls fsync() to ensure bits hit disk platters/NAND, and commits. The dirty memory pages are flushed to table files lazily later."
        },
        {
          term: "fsync() Syscall",
          plainEnglish: "An operating system command that forces all dirty buffered page data in kernel RAM to be physically flushed and persisted onto non-volatile disk hardware.",
          whyInvented: "Operating systems buffer disk writes in RAM. If the server loses power, buffered data vanishes unless fsync() forced it onto persistent storage.",
          howItWorks: "fsync() blocks the executing thread until the NVMe/HDD controller acknowledges that the data has reached non-volatile flash or battery-backed cache."
        }
      ],
      architectureCard: {
        title: "The ARIES Recovery Protocol: Analysis, Redo, Undo",
        physicalInvariant: "Calling fsync() on rotational disks takes ~5–10ms. On NVMe SSDs, fsync() takes ~0.1–0.5ms. A database cannot commit more than ~2,000–10,000 transactions per second per thread without group commit batching.",
        mentalModel: "When a database crashes mid-transaction (power outage), it recovers using the ARIES protocol in 3 phases: 1. Analysis Phase (scans WAL to identify dirty pages and active uncommitted transactions), 2. Redo Phase (replays all WAL changes to bring pages to the state right before crash), 3. Undo Phase (rolls back all transactions that were active and uncommitted at crash time).",
        flowSteps: [
          "1. Transaction modifies user balance from $100 to $150 in memory buffer pool",
          "2. Engine writes change record to WAL buffer: [Tx101: Page 42, Offset 12, $100 -> $150]",
          "3. COMMIT is issued: Engine executes fsync() on the WAL file (Durable!)",
          "4. Power drops! On reboot, ARIES Redo phase replays WAL, restoring the $150 balance perfectly"
        ],
        formulaTitle: "WAL Group Commit Throughput Sizing Formula",
        formulaMath: "Max TPS = 1 / fsync_latency  |  With Group Commit: Max TPS = Batch_Size / fsync_latency",
        formulaExplanation: "If fsync() takes 1ms, a single thread can execute at most 1,000 commits/sec. Databases use 'Group Commit' to batch 50 concurrent transactions into a single fsync(), scaling throughput to 50,000 TPS on the same drive."
      },
      codeCard: {
        title: "PostgreSQL WAL & Checkpoint Configuration (postgresql.conf)",
        language: "bash",
        code: "# Maximize sequential WAL performance and crash recovery safety\nwal_level = replica\nsynchronous_commit = on          # Enforce fsync on commit for 100% durability\nwal_writer_delay = 10ms          # Group commit flush interval\nmax_wal_size = 16GB              # Maximum size between checkpoints\ncheckpoint_completion_target = 0.9 # Smooth checkpoint I/O over 90% of interval",
        takeaway: "Disabling 'synchronous_commit = off' boosts write speed by 10x by skipping fsync(), but risks losing the last few milliseconds of transactions during a sudden power outage."
      },
      caseStudyCard: {
        company: "PostgreSQL",
        incidentOrChallenge: "High-volume financial transactions were bottlenecked at 800 commits per second because individual transactions each waited for physical disk fsync() acknowledgment.",
        solution: "Engineered Group Commit in the PostgreSQL WAL writer: concurrent transactions wait in a tiny microsecond queue, allowing the engine to flush dozens of commits in a single combined fsync() write.",
        keyMetric: "Scaled transaction commit throughput from 800 TPS to over 40,000 TPS on identical hardware."
      },
      simulator: {
        param1Label: "Disk fsync Latency (ms)",
        param1Min: 1,
        param1Max: 10,
        param1Default: 2,
        param2Label: "Group Commit Batch Size",
        param2Min: 1,
        param2Max: 100,
        param2Default: 25
      }
    },
    questions: [
      {
        id: "s33_q1",
        question: "Why can a relational database safely return a 'SUCCESS / COMMIT' response to a client BEFORE the modified data has been written to the actual table data files on disk?",
        options: [
          "Because the data is cached in the client's browser cookies",
          "Because the change has already been sequentially written and fsync'd to the Write-Ahead Log (WAL); if the database crashes before writing to table files, the ARIES recovery process will replay the WAL on reboot",
          "Because databases don't need to persist data to disk until midnight",
          "Because SQL transactions are purely advisory"
        ],
        correctAnswer: 1,
        explanation: "This is the core foundation of database durability: Write-Ahead Logging. Because the change is appended sequentially to the WAL and flushed with fsync(), the transaction is durable. Writing dirty table pages (which are scattered randomly across gigabytes of files) can happen lazily in the background via checkpoints."
      },
      {
        id: "s33_q2",
        question: "What are the three sequential phases executed by the ARIES recovery algorithm when a database restarts after a sudden crash?",
        options: [
          "Format, Partition, Mount",
          "Analysis (find dirty pages & active txns), Redo (replay all history to restore state), Undo (rollback uncommitted active transactions)",
          "Scan, Filter, Sort",
          "Encrypt, Compress, Replicate"
        ],
        correctAnswer: 1,
        explanation: "ARIES operates in three distinct phases: 1. Analysis: scans WAL forward from the last checkpoint to identify dirty pages and transactions that were active at the crash. 2. Redo: replays all logged changes forward (repeating history) to return the database to the exact state at the instant of failure. 3. Undo: rolls back all transactions that never committed."
      },
      {
        id: "s33_q3",
        question: "How does 'Group Commit' enable databases to process 50,000 transactions per second on a storage drive that can only perform 1,000 fsync() operations per second?",
        options: [
          "It skips writing to the hard drive completely",
          "It holds committing transactions in memory for a fraction of a millisecond and bundles dozens of concurrent transaction log entries into a single shared fsync() syscall",
          "It uses 50 different hard drives for each query",
          "It converts SQL into NoSQL"
        ],
        correctAnswer: 1,
        explanation: "If each transaction calls fsync() individually, throughput is capped at 1,000 TPS by physical disk latency (1ms). With Group Commit, when Transaction 1 initiates an fsync(), Transactions 2 through 50 join its queue. A single fsync() flushes all 50 commits simultaneously, scaling throughput 50x with zero loss of durability."
      }
    ]
  },

  {
    id: 34,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "ACID Guarantees: Atomicity, Consistency, Isolation & Durability",
    icon: "💎",
    company: "Stripe",
    concept: {
      beginnerGlossary: [
        {
          term: "Atomicity (All or Nothing)",
          plainEnglish: "Guarantees that a transaction consisting of multiple steps either completely succeeds or completely fails; there is no half-executed state.",
          whyInvented: "In a bank transfer, debiting $100 from Alice and crediting $100 to Bob must never stop halfway if the server crashes after the debit.",
          howItWorks: "Implemented using undo logs and write-ahead logs. If an error occurs midway, the database rolls back all executed statements."
        },
        {
          term: "Isolation (Concurrent Safety)",
          plainEnglish: "Guarantees that multiple transactions executing concurrently at the same time do not interfere with or corrupt each other's data.",
          whyInvented: "Two customers buying the last airline ticket at the exact same millisecond must not both receive confirmation.",
          howItWorks: "Enforced using concurrency control: locks (Two-Phase Locking) or multi-version snapshots (MVCC)."
        }
      ],
      architectureCard: {
        title: "The ACID Implementation Architecture Matrix",
        physicalInvariant: "ACID is not a single feature; it is an architectural contract implemented across 4 distinct subsystems: A (Undo Log), C (Invariants/Foreign Keys), I (Locks/MVCC), D (WAL + fsync).",
        mentalModel: "Atomicity = Undo Log (reversing partial writes). Consistency = Application invariants + Foreign Key / Unique constraints. Isolation = Locks (2PL) and Snapshot isolation (MVCC) preventing race conditions. Durability = WAL flushed to non-volatile disk before returning 200 OK.",
        flowSteps: [
          "1. Atomicity: Debit Account A (-$100); Credit Account B (+$100). If Step 2 fails, Step 1 is rolled back via Undo Log",
          "2. Consistency: Database validates CHECK(balance >= 0); rejects write if balance would violate constraint",
          "3. Isolation: MVCC ensures concurrent reporting query sees snapshot balance before the transfer",
          "4. Durability: Engine issues fsync() on WAL before returning success to banking client"
        ],
        formulaTitle: "Financial Double-Spend Invariant Formula",
        formulaMath: "Sum(Balances_After_Transfer) == Sum(Balances_Before_Transfer)",
        formulaExplanation: "A transaction must preserve physical system invariants. If $100 leaves Alice, exactly $100 must enter Bob. Total system money must remain identical."
      },
      codeCard: {
        title: "Atomic Financial Ledger Transfer in PostgreSQL",
        language: "sql",
        code: "BEGIN TRANSACTION;\n\n-- 1. Deduct from sender with balance guard\nUPDATE accounts \nSET balance = balance - 100 \nWHERE id = 'alice' AND balance >= 100;\n\n-- Check if deduction succeeded; if 0 rows updated, abort!\n-- 2. Credit recipient\nUPDATE accounts \nSET balance = balance + 100 \nWHERE id = 'bob';\n\n-- Atomically commit both operations or rollback on error\nCOMMIT;",
        takeaway: "Never execute multi-step balance changes in separate API calls; wrap them in an explicit atomic database transaction."
      },
      caseStudyCard: {
        company: "Stripe",
        incidentOrChallenge: "Handling millions of financial payment authorizations and merchant ledger balance transfers globally without ever double-charging a customer or creating money out of thin air.",
        solution: "Architected core payment ledgers on ACID-compliant relational databases (PostgreSQL and Spanner) with strict serializable isolation and idempotent API request keys.",
        keyMetric: "Processes over $1 trillion in financial transactions annually with zero ledger balance discrepancies."
      },
      simulator: {
        param1Label: "Concurrent Transactions per Second",
        param1Min: 100,
        param1Max: 10000,
        param1Default: 1500,
        param2Label: "Contended Hot Accounts",
        param2Min: 1,
        param2Max: 50,
        param2Default: 5
      }
    },
    questions: [
      {
        id: "s34_q1",
        question: "If a database server experiences a sudden power loss while executing step 4 of a 5-step banking transaction, which ACID property guarantees that steps 1, 2, and 3 are completely undone?",
        options: [
          "Isolation",
          "Atomicity",
          "Durability",
          "Scalability"
        ],
        correctAnswer: 1,
        explanation: "Atomicity ('All or Nothing') guarantees that a transaction cannot be partially committed. When the database boots back up, the recovery process inspects the WAL/undo log, recognizes that the transaction was never committed before the crash, and completely rolls back steps 1, 2, and 3."
      },
      {
        id: "s34_q2",
        question: "How does 'Consistency' in ACID differ from 'Consistency' in the CAP theorem?",
        options: [
          "They are identical concepts with the same definition",
          "ACID Consistency means preserving application schema rules and invariants (e.g. balance >= 0, foreign keys); CAP Consistency means every read returns the most recent write across distributed replicas (linearizability)",
          "ACID consistency only applies to NoSQL databases",
          "CAP consistency applies only to single-server SQLite"
        ],
        correctAnswer: 1,
        explanation: "This is one of the most confusing naming collisions in computer science. ACID Consistency is an application property: database constraints (unique keys, check constraints, foreign keys) are never violated. CAP Consistency is a distributed systems property: all distributed replica nodes show the exact same data at the same instant (Linearizability)."
      },
      {
        id: "s34_q3",
        question: "What does the 'Durability' guarantee in an ACID-compliant database mean to an application developer?",
        options: [
          "The database hardware will never physically break",
          "Once a transaction commits successfully, its changes are permanently recorded in non-volatile storage and will survive subsequent power outages, OS crashes, or server reboots",
          "The database code is written in C without memory leaks",
          "The database automatically backs up data to tape every night"
        ],
        correctAnswer: 1,
        explanation: "Durability guarantees that once the database notifies the application that a transaction committed, the data is written to non-volatile storage (via WAL and fsync). Even if someone pulls the server's power plug 1 millisecond later, the data will still be there when power is restored."
      }
    ]
  },

  {
    id: 35,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Transaction Isolation Levels & Read Anomalies",
    icon: "🔬",
    company: "Robinhood",
    concept: {
      beginnerGlossary: [
        {
          term: "Dirty Read",
          plainEnglish: "Transaction A reads data written by Transaction B that has NOT yet committed. If Transaction B subsequently rolls back, Transaction A acted on fake, phantom data.",
          whyInvented: "Allowed under 'Read Uncommitted' isolation level for raw speed, but dangerous for financial correctness.",
          howItWorks: "Alice updates balance to $1,000,000. Bob reads $1,000,000. Alice's transaction aborts. Bob just read dirty data that never existed."
        },
        {
          term: "Non-Repeatable Read & Phantom Read",
          plainEnglish: "Non-Repeatable Read: Reading the same row twice returns different values because another transaction modified it. Phantom Read: Querying a range twice returns new rows inserted by another transaction.",
          whyInvented: "Distinguishes between 'Read Committed', 'Repeatable Read', and 'Serializable' isolation levels.",
          howItWorks: "Repeatable Read locks rows or uses MVCC snapshots. Phantom reads require range/predicate locking to block new inserts."
        }
      ],
      architectureCard: {
        title: "The ANSI SQL Isolation Spectrum & Anomaly Matrix",
        physicalInvariant: "Higher isolation levels require more aggressive locking and snapshot validation, directly reducing concurrent transaction throughput. Serializable isolation guarantees correctness at the cost of abort retries.",
        mentalModel: "The 4 Standard Isolation Levels: 1. Read Uncommitted (Suffers Dirty Reads, Non-Repeatable Reads, Phantoms), 2. Read Committed (Blocks Dirty Reads; default in Postgres/Oracle), 3. Repeatable Read (Blocks Dirty & Non-Repeatable Reads; default in MySQL InnoDB), 4. Serializable (Blocks ALL anomalies; behaves as if transactions ran sequentially).",
        flowSteps: [
          "1. Tx1: SELECT COUNT(*) FROM trades WHERE user_id = 12 (Returns 5)",
          "2. Tx2: INSERT INTO trades (user_id, amount) VALUES (12, 100); COMMIT;",
          "3. Tx1: SELECT COUNT(*) FROM trades WHERE user_id = 12 (Under Read Committed, returns 6 -> Phantom!)",
          "4. Under Serializable: Tx2 is blocked or Tx1 aborts with serialization failure"
        ],
        formulaTitle: "Isolation Level Anomaly Prevention Matrix",
        formulaMath: "Read Uncommitted < Read Committed < Repeatable Read < Serializable",
        formulaExplanation: "Read Committed eliminates Dirty Reads. Repeatable Read eliminates Non-Repeatable Reads. Serializable eliminates Phantom Reads and Write Skew."
      },
      codeCard: {
        title: "Setting Isolation Levels in SQL Transactions",
        language: "sql",
        code: "-- Set isolation level for high-precision financial calculation\nBEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\n\n-- Step 1: Check account balance sum\nSELECT SUM(balance) FROM accounts WHERE user_id = 101;\n\n-- Step 2: Deduct transaction fee\nUPDATE accounts SET balance = balance - 25 WHERE user_id = 101;\n\n-- If a concurrent transaction modified accounts in Step 1, COMMIT will throw:\n-- ERROR: could not serialize access due to read/write dependencies\nCOMMIT;",
        takeaway: "When using Serializable isolation, your application MUST implement automatic retry logic to catch serialization failure exceptions."
      },
      caseStudyCard: {
        company: "Robinhood",
        incidentOrChallenge: "A race condition under Read Committed isolation allowed users to initiate simultaneous cash withdrawals from multiple browser tabs, causing account balances to drop below zero (Write Skew anomaly).",
        solution: "Elevated financial withdrawal transactions to Serializable isolation and implemented atomic row-level locks using SELECT ... FOR UPDATE.",
        keyMetric: "Completely eliminated concurrent double-withdrawal balance glitches across all account services."
      },
      simulator: {
        param1Label: "Isolation Level (1=Read Comm, 2=Repeat Read, 3=Serializable)",
        param1Min: 1,
        param1Max: 3,
        param1Default: 2,
        param2Label: "Concurrent Contending Transactions",
        param2Min: 5,
        param2Max: 100,
        param2Default: 30
      }
    },
    questions: [
      {
        id: "s35_q1",
        question: "What is a 'Dirty Read' anomaly in database transactions?",
        options: [
          "Reading data from a corrupted hard drive sector",
          "A transaction reads uncommitted changes written by another active transaction that could still be rolled back",
          "A query that returns more than 1,000 rows",
          "A slow SQL query that takes more than 10 seconds"
        ],
        correctAnswer: 1,
        explanation: "A dirty read occurs when Transaction A modifies a row but has not yet committed. Transaction B reads that modified value. If Transaction A then rolls back (aborts), Transaction B has acted on data that was never officially committed to the database."
      },
      {
        id: "s35_q2",
        question: "What is the difference between a 'Non-Repeatable Read' and a 'Phantom Read'?",
        options: [
          "They are two names for the identical phenomenon",
          "A Non-Repeatable Read occurs when an existing single row is modified or deleted by another transaction between two reads; a Phantom Read occurs when new rows matching a query's WHERE filter are inserted by another transaction between two reads",
          "Non-repeatable reads only occur in MySQL; phantoms only occur in PostgreSQL",
          "Phantom reads only happen on Halloween"
        ],
        correctAnswer: 1,
        explanation: "Non-repeatable read affects existing rows (re-reading user #42 returns a different name because someone updated row #42). Phantom read affects range queries (re-executing `WHERE age > 30` returns 11 rows instead of 10 because another transaction inserted a new 35-year-old user)."
      },
      {
        id: "s35_q3",
        question: "Why don't production databases run at 'Serializable' isolation level by default?",
        options: [
          "Because Serializable isolation is illegal under GDPR",
          "Serializable isolation incurs severe performance costs: extensive lock contention, reduced concurrency, high latency, and frequent transaction aborts that require applications to implement retry loops",
          "Because Serializable isolation disables indexes",
          "Because it only works with single-core CPUs"
        ],
        correctAnswer: 1,
        explanation: "To guarantee that concurrent transactions produce identical results to serial execution, the engine must either lock entire ranges of keys (preventing others from writing) or detect read/write conflicts and abort transactions. At high QPS, abort rates explode, devastating throughput. Most databases default to Read Committed or Repeatable Read."
      }
    ]
  },

  {
    id: 36,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Concurrency Control: Two-Phase Locking (2PL) vs Optimistic (OCC)",
    icon: "🔒",
    company: "Amazon AWS",
    concept: {
      beginnerGlossary: [
        {
          term: "Two-Phase Locking (2PL - Pessimistic)",
          plainEnglish: "A concurrency protocol where transactions acquire locks before reading/writing data: Phase 1 (Growing): Locks are acquired. Phase 2 (Shrinking): Locks are released.",
          whyInvented: "Guarantees serializability: prevents conflicting transactions from reading or modifying data until the lock owner finishes.",
          howItWorks: "Shared Locks (S-locks) allow multiple concurrent readers. Exclusive Locks (X-locks) block all other readers and writers. Can cause Deadlocks."
        },
        {
          term: "Optimistic Concurrency Control (OCC)",
          plainEnglish: "A lock-free protocol where transactions execute without taking locks, assuming conflicts are rare. Before committing, the transaction checks if data changed; if so, it aborts and retries.",
          whyInvented: "Locks cause blocking, thread stalls, and deadlocks. In low-contention workloads, OCC delivers vastly higher throughput.",
          howItWorks: "Uses version numbers (`version = version + 1`). If `UPDATE ... WHERE id = 1 AND version = 5` updates 0 rows, a conflict occurred."
        }
      ],
      architectureCard: {
        title: "Pessimistic Locking vs Optimistic Versioning Protocols",
        physicalInvariant: "Pessimistic locking blocks threads in kernel wait queues (context switching). Optimistic concurrency avoids locking, but burns CPU cycles aborting and retrying under high contention.",
        mentalModel: "Use Pessimistic 2PL when data contention is HIGH (e.g. buying the final ticket to a concert; conflicts are guaranteed, so waiting for a lock is better than aborting 10,000 times). Use Optimistic OCC when data contention is LOW (e.g. users editing their own private profile; collisions are rare, so lock-free updates are fastest).",
        flowSteps: [
          "1. OCC Read Phase: Read user row (id=42, balance=100, version=3)",
          "2. OCC Modify Phase: Application computes new balance ($150) in memory",
          "3. OCC Validate/Commit Phase: UPDATE users SET balance=150, version=4 WHERE id=42 AND version=3;",
          "4. If rows_updated == 1: Success! If rows_updated == 0: Concurrent update happened; abort & retry!"
        ],
        formulaTitle: "OCC Abort Rate under High Contention Formula",
        formulaMath: "Abort Probability P(abort) ≈ 1 - (1 - (Contended_Keys / Total_Keys))^Concurrency",
        formulaExplanation: "When 100 concurrent workers update the same inventory record, OCC aborts 99 out of 100 transactions, causing a retry storm that melts CPU. In this high-contention case, pessimistic row locking (SELECT FOR UPDATE) is 10x faster."
      },
      codeCard: {
        title: "Pessimistic (2PL) vs Optimistic (OCC) in SQL",
        language: "sql",
        code: "-- 1. Pessimistic 2PL (SELECT ... FOR UPDATE)\nBEGIN;\nSELECT balance FROM accounts WHERE id = 'user_1' FOR UPDATE; -- Acquires Exclusive Lock\nUPDATE accounts SET balance = balance - 50 WHERE id = 'user_1';\nCOMMIT; -- Releases lock\n\n-- 2. Optimistic Concurrency Control (OCC)\n-- App reads: balance = 500, version = 12\nUPDATE accounts \nSET balance = 450, version = version + 1 \nWHERE id = 'user_1' AND version = 12;\n-- Check in application: if rows_affected == 0, throw OptimisticLockException and retry",
        takeaway: "Use optimistic versioning (`version = version + 1`) for web forms and user dashboards; use pessimistic `FOR UPDATE` for high-velocity inventory reservations."
      },
      caseStudyCard: {
        company: "Amazon AWS",
        incidentOrChallenge: "DynamoDB and Aurora customers updating hot partition counters using optimistic locking experienced 90%+ transaction abort retry storms during flash sales.",
        solution: "Advised migrating hot inventory decrement patterns to pessimistic row locking or atomic decrement operators (`balance = balance - 1`), avoiding OCC validation failures.",
        keyMetric: "Reduced flash sale transaction abort rates from 85% to 0%, stabilizing checkout throughput."
      },
      simulator: {
        param1Label: "Data Contention Level (1=Low, 2=Medium, 3=Extreme)",
        param1Min: 1,
        param1Max: 3,
        param1Default: 1,
        param2Label: "Concurrency Protocol (1=Pessimistic 2PL, 2=Optimistic OCC)",
        param2Min: 1,
        param2Max: 2,
        param2Default: 2
      }
    },
    questions: [
      {
        id: "s36_q1",
        question: "How does Optimistic Concurrency Control (OCC) detect that another transaction modified a row while the current transaction was preparing its update?",
        options: [
          "It compares the client's IP address",
          "It uses a version number or timestamp column; the update includes `WHERE id = ? AND version = old_version`; if 0 rows are updated, a concurrent modification occurred",
          "It scans the entire database for duplicate passwords",
          "It asks the operating system kernel for permission"
        ],
        correctAnswer: 1,
        explanation: "OCC uses atomic compare-and-swap semantics. When reading the row, the application records `version = 7`. When saving, it executes `UPDATE ... SET ..., version = 8 WHERE id = 1 AND version = 7`. If another transaction already committed version 8, the WHERE clause matches 0 rows, signaling to the application that it must retry."
      },
      {
        id: "s36_q2",
        question: "What is a 'Deadlock' in Two-Phase Locking (2PL), and how do relational databases resolve it?",
        options: [
          "When a hard drive stops spinning",
          "Transaction A holds Lock 1 and waits for Lock 2, while Transaction B holds Lock 2 and waits for Lock 1; neither can proceed. The database detects the cycle in its wait-for graph and aborts one transaction",
          "When a table has too many indexes",
          "When the database runs out of RAM"
        ],
        correctAnswer: 1,
        explanation: "A deadlock is a circular dependency where two transactions each block waiting for a lock held by the other. Databases run background deadlock detection algorithms that maintain a 'wait-for graph'. When a directed cycle is detected, the engine chooses one transaction as the 'victim', aborts it to release its locks, and allows the other to proceed."
      },
      {
        id: "s36_q3",
        question: "Under what specific workload condition does Optimistic Concurrency Control (OCC) perform significantly WORSE than Pessimistic Locking?",
        options: [
          "When all queries are read-only SELECTs",
          "Under high-contention write workloads where thousands of concurrent transactions attempt to modify the exact same popular rows (e.g. concert ticket inventory flash sales), causing massive abort retry storms",
          "When using SSD drives instead of HDDs",
          "When databases are deployed in Docker containers"
        ],
        correctAnswer: 1,
        explanation: "Under high contention, almost every OCC transaction will fail the version check because someone else updated the row first. Thousands of threads spin in CPU-intensive abort-retry loops with near-zero progress. Pessimistic locking (queuing on an exclusive lock) enforces orderly serialization without wasted retries."
      }
    ]
  },

  {
    id: 37,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Multi-Version Concurrency Control (MVCC): Readers Never Block Writers",
    icon: "📸",
    company: "PostgreSQL",
    concept: {
      beginnerGlossary: [
        {
          term: "MVCC (Multi-Version Concurrency Control)",
          plainEnglish: "A concurrency mechanism where the database maintains multiple historical versions of each row simultaneously, so readers and writers never block each other.",
          whyInvented: "In legacy databases, reading a table required taking read locks that blocked writers, and writers blocked readers. MVCC allows readers and writers to execute concurrently with zero locking.",
          howItWorks: "Updating a row does not overwrite it; it writes a new version of the row tagged with transaction timestamps (xmin, xmax). Readers view a consistent point-in-time snapshot."
        },
        {
          term: "Vacuuming & Garbage Collection",
          plainEnglish: "The background process in PostgreSQL that scans tables and reclaims disk space occupied by dead, obsolete row versions (bloat).",
          whyInvented: "Because MVCC creates a new row version on every update and delete, dead rows accumulate indefinitely unless vacuumed.",
          howItWorks: "Once all transactions older than a row's xmax have finished, VACUUM marks those dead row slots reusable for future inserts."
        }
      ],
      architectureCard: {
        title: "PostgreSQL MVCC Row Header (xmin / xmax) Mechanics",
        physicalInvariant: "Every PostgreSQL table row (tuple) contains a 23-byte header including xmin (creating transaction ID) and xmax (deleting/superseding transaction ID). Updates are physically an INSERT of a new tuple followed by setting xmax on the old tuple.",
        mentalModel: "Think of MVCC as an immutable snapshot. When Transaction 500 begins, its snapshot visibility rule is: 'Show me all rows created by committed transactions <= 499, and ignore all rows created by transactions >= 500'. Long-running transactions prevent VACUUM from cleaning dead rows, leading to table bloat.",
        flowSteps: [
          "1. Row created by Tx100: [xmin: 100, xmax: 0, data: 'Alice', balance: 100]",
          "2. Tx105 updates balance to 200: Sets old row [xmax: 105]; Inserts new row [xmin: 105, xmax: 0, balance: 200]",
          "3. Long-running Tx102 reads table: It sees Tx105 is in the future! Reads old row (balance=100) with ZERO locks!",
          "4. Autovacuum cleans up old tuple [xmin: 100, xmax: 105] only after Tx102 finally terminates"
        ],
        formulaTitle: "MVCC Table Bloat Ratio Formula",
        formulaMath: "Table Bloat % = (Dead Tuples / (Live Tuples + Dead Tuples)) * 100",
        formulaExplanation: "A table with 1,000,000 live rows undergoing 50,000 updates/minute with autovacuum disabled will swell to 10,000,000 dead rows in hours—causing queries to scan 10x more disk pages (bloat)."
      },
      codeCard: {
        title: "Inspecting PostgreSQL MVCC xmin/xmax and Table Bloat",
        language: "sql",
        code: "-- Inspect hidden MVCC system columns on any PostgreSQL table\nSELECT xmin, xmax, ctid, username, email FROM users LIMIT 5;\n\n-- Inspect dead tuple accumulation (table bloat) in real time\nSELECT relname, n_live_tup, n_dead_tup, \n       round(n_dead_tup * 100.0 / nullif(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct\nFROM pg_stat_user_tables\nORDER BY n_dead_tup DESC;\n\n-- Manually trigger dead tuple reclamation\nVACUUM (VERBOSE, ANALYZE) users;",
        takeaway: "Never allow long-running transactions (e.g. unclosed connections or 2-hour analytics queries) on OLTP databases; they block autovacuum from cleaning dead tuples, causing catastrophic table bloat."
      },
      caseStudyCard: {
        company: "PostgreSQL",
        incidentOrChallenge: "A fintech startup's database ran out of disk space and queries ground to a halt; an abandoned developer psql session had been holding an open transaction for 4 days.",
        solution: "Configured 'idle_in_transaction_session_timeout = 60s' to automatically terminate orphaned open transactions, and tuned autovacuum cost limits to aggressively reclaim dead tuples.",
        keyMetric: "Reclaimed 450 GB of disk space from bloated tables and restored sub-5ms query performance."
      },
      simulator: {
        param1Label: "Update Ingestion Rate (Updates/sec)",
        param1Min: 100,
        param1Max: 5000,
        param1Default: 1000,
        param2Label: "Autovacuum Aggressiveness (1=Slow, 3=Aggressive)",
        param2Min: 1,
        param2Max: 3,
        param2Default: 2
      }
    },
    questions: [
      {
        id: "s37_q1",
        question: "What is the primary operational advantage of Multi-Version Concurrency Control (MVCC) over lock-based concurrency control?",
        options: [
          "It eliminates the need for database backups",
          "Readers never block writers, and writers never block readers; read queries execute without acquiring shared locks by reading consistent point-in-time snapshots",
          "It makes SQL queries execute in parallel on GPU graphics cards",
          "It converts all tables into flat CSV files"
        ],
        correctAnswer: 1,
        explanation: "In traditional lock-based systems, an analytics query reading 10 million rows acquires shared read locks, halting all incoming write updates until the read finishes. In MVCC, writers create new versions of rows while readers view historical snapshot versions, allowing heavy reporting queries to run alongside high-velocity writes with zero lock contention."
      },
      {
        id: "s37_q2",
        question: "In PostgreSQL's MVCC implementation, how does an 'UPDATE' statement physically modify a row on disk?",
        options: [
          "It overwrites the existing bytes directly inside the 8KB page",
          "It leaves the old row on disk and marks its header 'xmax' with the current transaction ID, then inserts a brand-new row version with 'xmin' set to the current transaction ID",
          "It deletes the table and recreates it",
          "It writes the change to the browser cache"
        ],
        correctAnswer: 1,
        explanation: "PostgreSQL never updates a tuple in-place. An UPDATE is physically an INSERT of a new tuple followed by a soft-delete of the old tuple (setting xmax). The old tuple remains on disk as a 'dead tuple' to satisfy any concurrent transactions running on older snapshots, until VACUUM cleans it up."
      },
      {
        id: "s37_q3",
        question: "Why does an abandoned, idle transaction left open in PostgreSQL ('idle in transaction') cause catastrophic database performance degradation over time?",
        options: [
          "It consumes 100% of the server's CPU cycles calculating primes",
          "It prevents PostgreSQL's autovacuum process from removing dead row versions created after the start of that transaction, causing table bloat, index bloat, and massive disk space waste",
          "It blocks all network ports on the server",
          "It changes the database collation to Latin1"
        ],
        correctAnswer: 1,
        explanation: "VACUUM can only clean up dead tuples that are older than the oldest active transaction in the entire database. If one forgotten connection has been open for 3 days, VACUUM cannot touch ANY dead tuple created in the last 3 days! Tables swell to 10x their normal size, and sequential scans must read gigabytes of dead garbage."
      }
    ]
  },

  {
    id: 38,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Scaling Reads: Primary-Replica Architecture & Asynchronous Replication",
    icon: "👥",
    company: "GitHub",
    concept: {
      beginnerGlossary: [
        {
          term: "Primary-Replica (Master-Follower)",
          plainEnglish: "An architecture where all write operations (INSERT, UPDATE, DELETE) go to a single Primary database, which streams changes to multiple read-only Replica databases.",
          whyInvented: "Most web applications are 95% reads and 5% writes. A single database primary can handle writes, while 5 replicas handle massive read volume.",
          howItWorks: "Replicas continuously ingest the Primary's WAL (Write-Ahead Log) stream and apply the changes locally to their own B-tree storage engines."
        },
        {
          term: "Asynchronous vs Synchronous Replication",
          plainEnglish: "Async: Primary commits immediately and ships WAL in background (fast writes, risk of data loss on failover). Sync: Primary blocks until at least one replica confirms writing to disk.",
          whyInvented: "Trades write latency against zero data loss guarantees (RPO - Recovery Point Objective).",
          howItWorks: "Async adds 0ms to write latency. Sync adds network RTT to every transaction commit."
        }
      ],
      architectureCard: {
        title: "WAL Streaming Replication Pipeline & Read Splitting",
        physicalInvariant: "Network RTT between data centers is ~10–50ms. Synchronous replication across regions adds 50ms to every single transaction commit. Asynchronous replication maintains local write speed (~1ms).",
        mentalModel: "The application uses a database proxy or ORM routing rule: writes route to Primary; reads route to a pool of Read Replicas. Because async replication has lag, reads sent to replicas may see slightly stale data.",
        flowSteps: [
          "1. User submits write: INSERT INTO comments ... -> Sent to Primary DB",
          "2. Primary writes to WAL, commits, and streams WAL records over TCP socket to Replicas",
          "3. Replica WAL Receiver thread receives bytes and queues them into local relay log",
          "4. Replica WAL Replayer process applies changes to replica data pages"
        ],
        formulaTitle: "Read Capacity Scaling Formula",
        formulaMath: "Total Read QPS = Primary_Read_Capacity + (Num_Replicas * Replica_Capacity)",
        formulaExplanation: "If 1 primary supports 2,000 read QPS and you deploy 5 read replicas, total cluster read throughput expands to 2,000 + (5 * 2,000) = 12,000 read QPS."
      },
      codeCard: {
        title: "PostgreSQL Physical WAL Streaming Replication Setup",
        language: "bash",
        code: "# Primary postgresql.conf:\nwal_level = replica\nmax_wal_senders = 10\nwal_keep_size = 4096MB\n\n# Replica recovery configuration (standby.signal):\nprimary_conninfo = 'host=10.0.0.1 port=5432 user=replicator password=SecretPass'\nrestore_command = 'cp /mnt/archive/%f %p'\n\n# Inspect replication lag on Primary:\n# SELECT client_addr, state, write_lag, flush_lag, replay_lag FROM pg_stat_replication;",
        takeaway: "Always monitor 'replay_lag'; even if bytes are transferred across the network, queries on replicas will read stale data if the replayer thread is CPU-saturated."
      },
      caseStudyCard: {
        company: "GitHub",
        incidentOrChallenge: "Handling tens of thousands of read-heavy repository page views and commit queries during major open-source software release events without overloading primary MySQL instances.",
        solution: "Deployed dozens of MySQL read replicas managed via GitHub's custom high-availability orchestrator (Orchestrator) and ProxySQL for dynamic read/write query splitting.",
        keyMetric: "Scaled read throughput by over 20x while isolating the primary database strictly for write transactions."
      },
      simulator: {
        param1Label: "Read Replica Count",
        param1Min: 1,
        param1Max: 16,
        param1Default: 4,
        param2Label: "Read vs Write Ratio (% Reads)",
        param2Min: 50,
        param2Max: 99,
        param2Default: 95
      }
    },
    questions: [
      {
        id: "s38_q1",
        question: "Why does adding more Read Replicas in a Primary-Replica architecture fail to increase WRITE throughput?",
        options: [
          "Because read replicas disable SQL transactions",
          "All write operations (INSERT, UPDATE, DELETE) must still be processed and serialized by the single Primary database; adding replicas actually slightly increases Primary CPU overhead to stream WAL logs to more followers",
          "Because read replicas only run on Windows",
          "Because replicas delete all written data"
        ],
        correctAnswer: 1,
        explanation: "In a primary-replica architecture, only the primary can accept writes. Adding 10 read replicas scales read throughput 10x, but write throughput remains strictly bottlenecked by the CPU, disk I/O, and lock contention of the single primary node. Scaling writes requires sharding or multi-master systems."
      },
      {
        id: "s38_q2",
        question: "What is the primary risk of using purely Asynchronous Replication between a primary database and its replicas during an unexpected primary crash?",
        options: [
          "All read replicas will immediately delete their operating systems",
          "Data loss (Recovery Point Objective > 0): transactions committed on the primary right before the crash that were still in-flight over the network and not yet received by replicas are permanently lost",
          "The database converts from SQL to NoSQL",
          "The database loses the ability to perform mathematical additions"
        ],
        correctAnswer: 1,
        explanation: "In asynchronous replication, the primary returns 'Success' to the client as soon as the WAL is flushed locally, without waiting for replicas to confirm receipt. If the primary suddenly loses power 2 milliseconds later, any un-streamed transactions are trapped on the dead machine's disk, causing data loss upon failover."
      },
      {
        id: "s38_q3",
        question: "How does 'Semi-Synchronous' replication balance write latency with data loss prevention?",
        options: [
          "It writes to disk only on weekends",
          "The primary commits only after at least ONE replica acknowledges that it has received and written the WAL log to its local relay storage, guaranteeing zero data loss if the primary fails",
          "It encrypts half of each packet",
          "It compresses the database using zip"
        ],
        correctAnswer: 1,
        explanation: "Semi-synchronous replication requires confirmation from at least one replica before committing, guaranteeing that at least two machines hold the data. If the primary crashes, the promoted replica is guaranteed to have all committed transactions, avoiding data loss while only waiting for the fastest replica's network RTT."
      }
    ]
  },

  {
    id: 39,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "Replication Lag & Consistency Anomalies: Read-Your-Own-Writes",
    icon: "⏳",
    company: "Twitter / X",
    concept: {
      beginnerGlossary: [
        {
          term: "Replication Lag",
          plainEnglish: "The delay (typically a few milliseconds to several seconds) between a write committing on the Primary and that same write appearing on a Read Replica.",
          whyInvented: "Network transit time and replica replay CPU throughput are not instantaneous; replicas are always slightly behind reality.",
          howItWorks: "If replica lag is 500ms, any query sent to that replica reads the state of the world as it existed 500 milliseconds ago."
        },
        {
          term: "Read-After-Write Consistency (Read-Your-Own-Writes)",
          plainEnglish: "A consistency guarantee ensuring that if a user updates their profile or posts a comment, THEY will immediately see their own update upon page reload.",
          whyInvented: "Prevents the infuriating user bug where a user posts a comment, refreshes the page, and the comment is missing because the read hit a lagging replica.",
          howItWorks: "Route reads from the authoring user to the Primary for 5–10 seconds after a write, while routing all other users to read replicas."
        }
      ],
      architectureCard: {
        title: "Replication Lag Anomalies & Routing Mitigation Patterns",
        physicalInvariant: "Replication across asynchronous networks cannot guarantee immediate global consistency without blocking writes (FLP Impossibility / PACELC theorem).",
        mentalModel: "Replication lag introduces 3 classic anomalies: 1. Reading Stale Data (missing your own updates), 2. Monotonic Reads violation (refreshing the page queries Replica A [lag 10ms] then Replica B [lag 500ms], making data appear to travel backwards in time!), 3. Consistent Prefix Reads violation (observing effects before causes).",
        flowSteps: [
          "1. User posts comment: POST /comment -> Written to Primary at t=0",
          "2. Browser redirects to GET /feed -> Query routed to Read Replica with 200ms lag",
          "3. Replica does NOT have comment yet! Browser shows 'No comments found'",
          "4. Fix: Application sets cookie 'last_write_timestamp'; routes user reads to Primary for next 5s"
        ],
        formulaTitle: "Replication Lag Safe Read Window Formula",
        formulaMath: "Route_To_Primary = (Now() - Last_User_Write_Time) < Max_Observed_Lag",
        formulaExplanation: "If max replication lag is 2 seconds, any user who performed a write within the last 5 seconds has their read queries pinned to the Primary, guaranteeing Read-Your-Own-Writes consistency."
      },
      codeCard: {
        title: "Read-Your-Own-Writes Query Routing Middleware (Node.js)",
        language: "javascript",
        code: "function getDatabaseConnection(req) {\n  const lastWriteTime = req.cookies.last_write_time || 0;\n  const timeSinceLastWrite = Date.now() - Number(lastWriteTime);\n\n  // If user modified data within the last 5 seconds, read from PRIMARY to avoid lag\n  if (timeSinceLastWrite < 5000) {\n    return primaryDB;\n  }\n  // Otherwise, distribute read load across read replica pool\n  return getReadReplica();\n}\n\napp.post('/api/profile', async (req, res) => {\n  await primaryDB.updateProfile(req.user.id, req.body);\n  res.cookie('last_write_time', Date.now(), { maxAge: 10000 });\n  res.json({ success: true });\n});",
        takeaway: "Never route 100% of reads to replicas without a read-your-own-writes bypass mechanism, or users will constantly report ghost missing data bugs."
      },
      caseStudyCard: {
        company: "Twitter / X",
        incidentOrChallenge: "Users tweeting and immediately refreshing their timeline would not see their newly posted tweet because timeline reads hit lagging read-replica caches.",
        solution: "Implemented client-side optimistic UI rendering combined with server-side read-your-own-writes pinning: a user's own timeline queries are served from the primary or local memory cache.",
        keyMetric: "Eliminated user reports of missing tweets while preserving 98% offload to read replicas."
      },
      simulator: {
        param1Label: "Replication Lag (ms)",
        param1Min: 10,
        param1Max: 2000,
        param1Default: 250,
        param2Label: "Page Refresh Rate (Seconds)",
        param2Min: 1,
        param2Max: 10,
        param2Default: 2
      }
    },
    questions: [
      {
        id: "s39_q1",
        question: "What causes the 'Monotonic Read' consistency violation anomaly in a system with multiple read replicas?",
        options: [
          "A hard drive failure on the primary server",
          "A user refreshes a page twice: the first read hits a replica with 5ms lag (showing fresh data), but the second read hits a different replica with 800ms lag, causing data to appear to 'travel backwards in time' and vanish",
          "The user's computer clock is set to the wrong timezone",
          "When SQL queries use ORDER BY DESC"
        ],
        correctAnswer: 1,
        explanation: "Monotonic read consistency guarantees that if a user sees a value at time t1, they will never see an older value at time t2. In a pool of replicas with varying lag, consecutive requests routed to different replicas cause the user to see fresh data on reload 1, and old stale data on reload 2—a disorienting time-travel anomaly."
      },
      {
        id: "s39_q2",
        question: "How can an application guarantee 'Read-Your-Own-Writes' consistency for a user without routing ALL global read traffic to the primary database?",
        options: [
          "By deleting all read replicas",
          "By tracking when the user last performed a write; for a few seconds following that write, the user's reads are routed to the Primary, while all other users continue reading from replicas",
          "By disabling browser caching",
          "By converting database tables to NoSQL"
        ],
        correctAnswer: 1,
        explanation: "Only the user who made the change cares about seeing it in the next 2 seconds! Other users reading the page won't notice a 200ms delay. Pinning only the authoring user's session to the primary for 5 seconds provides flawless user experience while keeping 99% of global read traffic off the primary."
      },
      {
        id: "s39_q3",
        question: "What is a major cause of sudden replication lag spikes on database read replicas?",
        options: [
          "The replica has too many CPU cores",
          "The replica is single-threaded in its WAL replay process, and the primary executed a massive batch write (e.g. updating 1 million rows in one statement), choking the replica's replay pipeline",
          "The network cable is too short",
          "The primary database switched to HTTPS"
        ],
        correctAnswer: 1,
        explanation: "On many databases, applying WAL logs on replicas is single-threaded or has bounded parallelism. If a developer runs `UPDATE users SET status = 'active'` affecting 2 million rows on the primary, that massive batch must be replayed on the replica. The replica's replay thread falls minutes behind real-time, causing massive replication lag."
      }
    ]
  },

  {
    id: 40,
    section: 4,
    sectionTitle: "Phase 4: Relational Databases, Transactions & Replication",
    title: "High Availability & Automated Failover: Split-Brain & Fencing Tokens",
    icon: "👑",
    company: "GitHub",
    concept: {
      beginnerGlossary: [
        {
          term: "Automated Failover",
          plainEnglish: "The process where a monitoring orchestrator detects that the Primary database is dead and automatically promotes a Read Replica to become the new Primary.",
          whyInvented: "Manual human failover takes 15–30 minutes, violating 99.99% uptime SLAs. Automated failover promotes a new leader in under 10 seconds.",
          howItWorks: "Consensus heartbeats monitor the leader. If a quorum confirms the leader is dead, the most up-to-date replica is promoted to read-write mode."
        },
        {
          term: "Fencing Token",
          plainEnglish: "A monotonically increasing counter issued by a consensus service (like ZooKeeper/Etcd) required with every write operation to reject old, demoted leaders.",
          whyInvented: "Prevents an old primary that experienced a transient GC pause from waking up and corrupting storage (Split-Brain).",
          howItWorks: "Storage nodes track the highest fencing token seen. If a write arrives with an older token (e.g. Token 42 after Token 43 was issued), it is rejected."
        }
      ],
      architectureCard: {
        title: "Split-Brain Catastrophe & The STONITH / Fencing Pattern",
        physicalInvariant: "In an asynchronous network, a node cannot distinguish between a dead leader and a transient network partition (FLP Impossibility theorem). Both sides of a partition may believe they are the legitimate leader.",
        mentalModel: "Split-Brain is the worst disaster in database operations: Two servers both believe they are the primary and accept conflicting writes simultaneously! Their data diverges irrevocably, requiring manual database reconciliation. High-availability systems use STONITH ('Shoot The Other Node In The Head') via hardware IPMI power cutoffs or cryptographic fencing tokens.",
        flowSteps: [
          "1. Primary Node 1 experiences a 15-second Java GC pause or network partition",
          "2. Orchestrator quorum assumes Node 1 dead; promotes Node 2 to Primary (Fencing Token = 53)",
          "3. Node 1 wakes up from GC pause, unaware it was replaced; attempts to write with old Token 52",
          "4. Storage tier / Replicas reject Node 1's write because 52 < 53! Split-Brain prevented!"
        ],
        formulaTitle: "Quorum Formation for Failover Formula",
        formulaMath: "Minimum Quorum = (N / 2) + 1",
        formulaExplanation: "In a 3-node orchestrator cluster, at least 2 nodes must agree to declare a leader dead and promote a replica. A partitioned single node cannot form a quorum (1 < 2), preventing rogue promotions."
      },
      codeCard: {
        title: "Fencing Token Verification in Storage Systems (Python)",
        language: "python",
        code: "class FencedStorageService:\n    def __init__(self):\n        self.latest_fencing_token = 0\n        self.data = {}\n\n    def write(self, key, value, fencing_token):\n        # Strictly reject writes from zombie old leaders\n        if fencing_token < self.latest_fencing_token:\n            raise Exception(f\"STALE LEADER FENCING ERROR: Token {fencing_token} < {self.latest_fencing_token}!\")\n        \n        # Accept write and update high-watermark token\n        self.latest_fencing_token = fencing_token\n        self.data[key] = value\n        return \"WRITE_SUCCESS\"",
        takeaway: "Never implement automated failover based on simple heartbeat timeouts without cryptographic fencing tokens or physical STONITH power fencing."
      },
      caseStudyCard: {
        company: "GitHub",
        incidentOrChallenge: "A brief network partition in GitHub's US-East data center caused an orchestrator to promote a replica while the old primary was still receiving writes, creating dual masters and divergent data.",
        solution: "Implemented GitHub Orchestrator with Raft consensus, enforcing automated fencing tokens, virtual IP reallocation, and semi-synchronous replication validation.",
        keyMetric: "Achieved zero-data-loss automated failovers executed in under 10 seconds without split-brain risk."
      },
      simulator: {
        param1Label: "Primary GC Pause Duration (s)",
        param1Min: 1,
        param1Max: 20,
        param1Default: 12,
        param2Label: "Heartbeat Failure Threshold (s)",
        param2Min: 2,
        param2Max: 10,
        param2Default: 5
      }
    },
    questions: [
      {
        id: "s40_q1",
        question: "What is 'Split-Brain' in a high-availability database cluster, and why is it considered the most catastrophic failure mode in distributed data systems?",
        options: [
          "When a CPU uses both memory channels simultaneously",
          "A network partition causes two database servers to both believe they are the legitimate active Primary, accepting contradictory, conflicting writes simultaneously and corrupting data beyond automated repair",
          "When an SQL query joins two tables with the same name",
          "When an administrator forgets the root password"
        ],
        correctAnswer: 1,
        explanation: "If Server A and Server B both believe they are the Primary, clients write to both machines. User 1 sends money on Server A, while User 2 sends money on Server B. The two transaction histories diverge and contradict each other. Merging them automatically is impossible without manually reconciling or discarding customer financial data."
      },
      {
        id: "s40_q2",
        question: "How does a 'Fencing Token' prevent a zombie primary (e.g. a server that paused for 20 seconds during a garbage collection cycle) from corrupting storage after being replaced?",
        options: [
          "It disconnects the server from the internet permanently",
          "The consensus service issues a monotonically increasing number (token) with each leader election; storage nodes reject any write tagged with an older token than the highest token they have already processed",
          "It forces the zombie server to reboot into Windows Safe Mode",
          "It encrypts the hard drive with a new password"
        ],
        correctAnswer: 1,
        explanation: "When Leader A is deposed, the new Leader B is assigned Fencing Token 43. When Leader A wakes up from its GC pause, it attempts to write using its stale Token 42. Storage nodes observe that Token 42 is less than the current high-water mark (43) and reject the write, rendering the zombie primary harmless."
      },
      {
        id: "s40_q3",
        question: "What does the acronym STONITH stand for in high-availability clustering, and how does it work?",
        options: [
          "Storage Transaction Output Network Interface Transmission Header",
          "'Shoot The Other Node In The Head': A failover mechanism where the newly promoted leader uses hardware management interfaces (IPMI/PDU) to physically cut power to the old leader before taking over",
          "Standard Technology Object Notation In The Hash",
          "Sequential Tracking Of Network Inbound Traffic Hops"
        ],
        correctAnswer: 1,
        explanation: "STONITH ('Shoot The Other Node In The Head') is a brutal but foolproof fencing technique. Before a backup node takes over the primary's VIP or storage volumes, it sends a command to the remote hardware power distribution unit (PDU) or server IPMI card to physically cut electric power to the old primary, guaranteeing it cannot execute rogue writes."
      }
    ]
  }
];

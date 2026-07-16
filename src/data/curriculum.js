// Bundled default curriculum for the FDE 90-day route.
// Extracted from App.jsx so the command palette and tests can import the
// same source of truth. `id` on every item is the stable key used for
// localStorage / Supabase persistence.

export const DEFAULT_PHASES = [
  {
    id: "p1",
    code: "01",
    title: "Python Foundations",
    sub: "Weeks 1–3 · Days 1–21",
    weeks: [
      {
        week: 1,
        title: "Python From Zero, Fast",
        items: [
          { id: "p1w1i1", text: "Variables, data types, operators", resource: { label: "Python Tutorial §3", url: "https://docs.python.org/3/tutorial/introduction.html" } },
          { id: "p1w1i2", text: "Control flow: if/else, for/while loops", resource: { label: "Python Tutorial §4", url: "https://docs.python.org/3/tutorial/controlflow.html" } },
          { id: "p1w1i3", text: "Functions, default args, *args/**kwargs", resource: { label: "Python Docs: Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" } },
          { id: "p1w1i4", text: "Lists, tuples, dicts, sets + comprehensions", resource: { label: "Real Python: Lists & Tuples", url: "https://realpython.com/python-lists-tuples/" } },
          { id: "p1w1i5", text: "String formatting & f-strings", resource: { label: "Real Python: f-Strings", url: "https://realpython.com/python-f-strings/" } },
          { id: "p1w1i6", text: "Error handling: try/except/finally", resource: { label: "Python Tutorial: Errors", url: "https://docs.python.org/3/tutorial/errors.html" } },
          { id: "p1w1i7", text: "Virtual environments & pip", resource: { label: "Python Tutorial: venv", url: "https://docs.python.org/3/tutorial/venv.html" } },
          { id: "p1w1i8", text: "🎯 Milestone: Port your BPUT SGPA calculation to Python from scratch", resource: null },
        ],
      },
      {
        week: 2,
        title: "Intermediate & Idiomatic Python",
        items: [
          { id: "p1w2i1", text: "Classes & OOP basics", resource: { label: "Python Tutorial: Classes", url: "https://docs.python.org/3/tutorial/classes.html" } },
          { id: "p1w2i2", text: "Inheritance, dunder methods, dataclasses", resource: { label: "Real Python: Data Classes", url: "https://realpython.com/python-data-classes/" } },
          { id: "p1w2i3", text: "File I/O & working with JSON/CSV", resource: { label: "Python Docs: csv module", url: "https://docs.python.org/3/library/csv.html" } },
          { id: "p1w2i4", text: "Decorators", resource: { label: "Real Python: Decorators Primer", url: "https://realpython.com/primer-on-python-decorators/" } },
          { id: "p1w2i5", text: "Context managers (the `with` statement)", resource: { label: "Real Python: The with Statement", url: "https://realpython.com/python-with-statement/" } },
          { id: "p1w2i6", text: "Type hints & the `typing` module", resource: { label: "Python Docs: typing", url: "https://docs.python.org/3/library/typing.html" } },
          { id: "p1w2i7", text: "Testing basics with pytest", resource: { label: "pytest: Getting Started", url: "https://docs.pytest.org/en/stable/getting-started.html" } },
          { id: "p1w2i8", text: "🎯 Milestone: CLI tool that cleans a messy CSV and outputs a report", resource: null },
        ],
      },
      {
        week: 3,
        title: "Python for Data & Backend",
        items: [
          { id: "p1w3i1", text: "pandas fundamentals: Series, DataFrame, indexing", resource: { label: "pandas: Intro Tutorials", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html" } },
          { id: "p1w3i2", text: "pandas groupby, merge, pivot tables", resource: { label: "pandas: Group By User Guide", url: "https://pandas.pydata.org/docs/user_guide/groupby.html" } },
          { id: "p1w3i3", text: "numpy fundamentals", resource: { label: "NumPy: Quickstart", url: "https://numpy.org/doc/stable/user/quickstart.html" } },
          { id: "p1w3i4", text: "FastAPI basics: routes, request/response models", resource: { label: "FastAPI Tutorial", url: "https://fastapi.tiangolo.com/tutorial/" } },
          { id: "p1w3i5", text: "SQLAlchemy — connecting Python to Postgres", resource: { label: "SQLAlchemy: Unified Tutorial", url: "https://docs.sqlalchemy.org/en/20/tutorial/" } },
          { id: "p1w3i6", text: "Async basics in Python (async/await)", resource: { label: "Python Docs: asyncio tasks", url: "https://docs.python.org/3/library/asyncio-task.html" } },
          { id: "p1w3i7", text: "🎯 Milestone: FastAPI service querying Postgres, running locally", resource: null },
        ],
      },
    ],
  },
  {
    id: "p2",
    code: "02",
    title: "Cloud & Containers",
    sub: "Weeks 4–6 · Days 22–42",
    weeks: [
      {
        week: 4,
        title: "Docker",
        items: [
          { id: "p2w4i1", text: "Images vs. containers, core concepts", resource: { label: "Docker: Overview", url: "https://docs.docker.com/get-started/docker-overview/" } },
          { id: "p2w4i2", text: "Writing a Dockerfile for a Python app", resource: { label: "Docker: Build Python Images", url: "https://docs.docker.com/language/python/build-images/" } },
          { id: "p2w4i3", text: "Volumes & networking basics", resource: { label: "Docker: Volumes", url: "https://docs.docker.com/storage/volumes/" } },
          { id: "p2w4i4", text: "Multi-stage builds (lean production images)", resource: { label: "Docker: Multi-Stage Builds", url: "https://docs.docker.com/build/building/multi-stage/" } },
          { id: "p2w4i5", text: "🎯 Milestone: Containerize the Week 3 FastAPI service", resource: null },
        ],
      },
      {
        week: 5,
        title: "Docker Compose + Kubernetes Intro",
        items: [
          { id: "p2w5i1", text: "Docker Compose fundamentals", resource: { label: "Docker: Compose Docs", url: "https://docs.docker.com/compose/" } },
          { id: "p2w5i2", text: "Kubernetes core concepts: pods, deployments, services", resource: { label: "Kubernetes Basics Tutorial", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" } },
          { id: "p2w5i3", text: "kubectl fundamentals", resource: { label: "Kubernetes: kubectl Reference", url: "https://kubernetes.io/docs/reference/kubectl/" } },
          { id: "p2w5i4", text: "ConfigMaps & Secrets", resource: { label: "Kubernetes: ConfigMaps", url: "https://kubernetes.io/docs/concepts/configuration/configmap/" } },
          { id: "p2w5i5", text: "(Stretch) Kubernetes the Hard Way — build intuition manually", resource: { label: "Kelsey Hightower: K8s the Hard Way", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way" } },
          { id: "p2w5i6", text: "🎯 Milestone: App + Postgres running together via Compose", resource: null },
        ],
      },
      {
        week: 6,
        title: "Cloud Platforms — AWS + GCP",
        items: [
          { id: "p2w6i1", text: "AWS ECS or EC2 deployment", resource: { label: "AWS: ECS Developer Guide", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html" } },
          { id: "p2w6i2", text: "AWS IAM basics (roles & policies)", resource: { label: "AWS: IAM Introduction", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" } },
          { id: "p2w6i3", text: "GCP Cloud Run basics", resource: { label: "Google Cloud: Cloud Run Docs", url: "https://cloud.google.com/run/docs" } },
          { id: "p2w6i4", text: "AWS ↔ GCP service mapping (speak both dialects)", resource: { label: "Google Cloud: AWS/Azure/GCP Comparison", url: "https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison" } },
          { id: "p2w6i5", text: "🎯 Milestone: Deploy the same container to AWS AND GCP", resource: null },
        ],
      },
    ],
  },
  {
    id: "p3",
    code: "03",
    title: "The Integration Wall",
    sub: "Weeks 7–9 · Days 43–63",
    weeks: [
      {
        week: 7,
        title: "Enterprise Authentication",
        items: [
          { id: "p3w7i1", text: "OAuth 2.0 fundamentals", resource: { label: "OAuth.net: OAuth 2.0", url: "https://oauth.net/2/" } },
          { id: "p3w7i2", text: "OIDC on top of OAuth", resource: { label: "OpenID: How Connect Works", url: "https://openid.net/developers/how-connect-works/" } },
          { id: "p3w7i3", text: "SAML fundamentals — the enterprise-specific gap", resource: { label: "Auth0: SAML Protocol", url: "https://auth0.com/docs/authenticate/protocols/saml" } },
          { id: "p3w7i4", text: "JWTs — structure, signing, verification", resource: { label: "JWT.io: Introduction", url: "https://jwt.io/introduction" } },
          { id: "p3w7i5", text: "🎯 Milestone: Write and teach back an OAuth vs OIDC vs SAML explainer", resource: null },
        ],
      },
      {
        week: 8,
        title: "Messy Data & Legacy Integration",
        items: [
          { id: "p3w8i1", text: "Idempotency patterns for unreliable systems", resource: { label: "AWS Builders' Library: Idempotent APIs", url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/" } },
          { id: "p3w8i2", text: "Exponential backoff & jitter", resource: { label: "AWS Builders' Library: Timeouts & Backoff", url: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/" } },
          { id: "p3w8i3", text: "Schema normalization from inconsistent sources", resource: null },
          { id: "p3w8i4", text: "Working against undocumented/legacy APIs", resource: null },
          { id: "p3w8i5", text: "🎯 Milestone: Pipeline pulling a real, messy public API into a clean schema", resource: null },
        ],
      },
      {
        week: 9,
        title: "Security & Compliance",
        items: [
          { id: "p3w9i1", text: "Postgres Row-Level Security, from first principles", resource: { label: "PostgreSQL Docs: Row Security", url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html" } },
          { id: "p3w9i2", text: "SECURITY DEFINER functions", resource: { label: "PostgreSQL Docs: CREATE FUNCTION", url: "https://www.postgresql.org/docs/current/sql-createfunction.html" } },
          { id: "p3w9i3", text: "k-anonymity & data minimization, generalized", resource: null },
          { id: "p3w9i4", text: "Differential privacy fundamentals", resource: { label: "Programming Differential Privacy (free book)", url: "https://programming-dp.com/" } },
          { id: "p3w9i5", text: "🎯 Milestone: Design a privacy-preserving analytics layer for a new dataset, on paper", resource: null },
        ],
      },
    ],
  },
  {
    id: "p4",
    code: "04",
    title: "AI-Native Stack",
    sub: "Weeks 10–12 · Days 64–84",
    weeks: [
      {
        week: 10,
        title: "LLM Fundamentals + RAG",
        items: [
          { id: "p4w10i1", text: "Embeddings & vector search fundamentals", resource: { label: "LangChain: Embedding Models", url: "https://python.langchain.com/docs/concepts/embedding_models/" } },
          { id: "p4w10i2", text: "Vector databases: pgvector (uses Postgres you know)", resource: { label: "pgvector on GitHub", url: "https://github.com/pgvector/pgvector" } },
          { id: "p4w10i3", text: "RAG pipeline architecture end to end", resource: { label: "LangChain: RAG Tutorial", url: "https://python.langchain.com/docs/tutorials/rag/" } },
          { id: "p4w10i4", text: "Chunking strategies", resource: { label: "Pinecone: Chunking Strategies", url: "https://www.pinecone.io/learn/chunking-strategies/" } },
          { id: "p4w10i5", text: "🎯 Milestone: RAG system over a real, messy dataset (not a tutorial sample)", resource: null },
        ],
      },
      {
        week: 11,
        title: "Agent Orchestration",
        items: [
          { id: "p4w11i1", text: "LangGraph fundamentals", resource: { label: "LangGraph Docs", url: "https://langchain-ai.github.io/langgraph/" } },
          { id: "p4w11i2", text: "CrewAI fundamentals (alternative framework)", resource: { label: "CrewAI Docs", url: "https://docs.crewai.com/" } },
          { id: "p4w11i3", text: "Tool / function calling patterns", resource: { label: "LangChain: Tool Calling Concepts", url: "https://python.langchain.com/docs/concepts/tool_calling/" } },
          { id: "p4w11i4", text: "🎯 Milestone: Ship one working multi-step agent, end to end", resource: null },
        ],
      },
      {
        week: 12,
        title: "Evaluation & Observability",
        items: [
          { id: "p4w12i1", text: "LLM evaluation frameworks", resource: { label: "Ragas: Evaluation Docs", url: "https://docs.ragas.io/" } },
          { id: "p4w12i2", text: "Building real eval datasets (the underrated skill)", resource: { label: "Eugene Yan: Evals", url: "https://eugeneyan.com/writing/evals/" } },
          { id: "p4w12i3", text: "Tracing & observability for LLM apps", resource: { label: "LangSmith Docs", url: "https://docs.smith.langchain.com/" } },
          { id: "p4w12i4", text: "Guardrails & output validation basics", resource: { label: "Guardrails AI Docs", url: "https://www.guardrailsai.com/docs" } },
          { id: "p4w12i5", text: "🎯 Milestone: Eval suite (10–15 cases) for your Week 10–11 build", resource: null },
        ],
      },
    ],
  },
  {
    id: "p5",
    code: "05",
    title: "Portfolio & Interview",
    sub: "Week 13 · Days 85–90",
    weeks: [
      {
        week: 13,
        title: "Consolidation",
        items: [
          { id: "p5w13i1", text: "Reframe BPUT Result Hub & Unify in FDE language (customer, ambiguity, ownership)", resource: null },
          { id: "p5w13i2", text: "Practice scoping vague, high-stakes problems out loud", resource: null },
          { id: "p5w13i3", text: "Run mock technical + behavioral interviews", resource: { label: "Pramp: Free Peer Mock Interviews", url: "https://www.pramp.com/" } },
          { id: "p5w13i4", text: "Update resume/LinkedIn specifically for FDE roles", resource: null },
          { id: "p5w13i5", text: "🎯 Milestone: Full narrative run-through of both projects, FDE-framed", resource: null },
        ],
      },
    ],
  },
];

export const DEFAULT_BONUS = {
  id: "bonus",
  code: "★",
  title: "Beyond Day 90: Staff / Principal-Level Mastery",
  sub: "Open-ended · the top 1% track",
  weeks: [
    {
      week: "∞",
      title: "Where the Top Sit",
      items: [
        { id: "bi1", text: "Distributed systems fundamentals", resource: { label: "“Designing Data-Intensive Applications” (Kleppmann)", url: "https://dataintensive.net/" } },
        { id: "bi2", text: "System design practice at real scale", resource: { label: "System Design Primer (GitHub)", url: "https://github.com/donnemartin/system-design-primer" } },
        { id: "bi3", text: "Technical writing & RFC authorship", resource: { label: "Google: Technical Writing Courses", url: "https://developers.google.com/tech-writing" } },
        { id: "bi4", text: "Open-source contribution", resource: { label: "Open Source Guide: How to Contribute", url: "https://opensource.guide/how-to-contribute/" } },
        { id: "bi5", text: "Applied AI systems at production scale", resource: { label: "Full Stack Deep Learning", url: "https://fullstackdeeplearning.com/" } },
        { id: "bi6", text: "ML systems design interviews & thinking", resource: { label: "Chip Huyen: ML Interviews Book", url: "https://huyenchip.com/ml-interviews-book/" } },
        { id: "bi7", text: "Negotiation & stakeholder management", resource: { label: "Harvard PON: Free Negotiation Reports", url: "https://www.pon.harvard.edu/free-reports/" } },
        { id: "bi8", text: "Public speaking / conference-level talks", resource: null },
        { id: "bi9", text: "Mentorship — building leverage through others", resource: null },
      ],
    },
  ],
};

export const DEFAULT_PARALLEL_TRACK = {
  id: "dsa",
  title: "Continuous Track: DSA & Competitive Programming",
  note: "Run this alongside every phase above — aim for 3–5 problems/week, not all at once at the end.",
  items: [
    { id: "dsa1", text: "Arrays & Strings fundamentals", resource: { label: "LeetCode: Array & String Explore Card", url: "https://leetcode.com/explore/learn/card/array-and-string/" } },
    { id: "dsa2", text: "Two pointers & sliding window", resource: { label: "LeetCode: Two Pointers Tag", url: "https://leetcode.com/tag/two-pointers/" } },
    { id: "dsa3", text: "Hashmaps & sets", resource: { label: "LeetCode: Hash Table Tag", url: "https://leetcode.com/tag/hash-table/" } },
    { id: "dsa4", text: "Recursion & backtracking", resource: { label: "LeetCode: Recursion I Explore Card", url: "https://leetcode.com/explore/learn/card/recursion-i/" } },
    { id: "dsa5", text: "Linked lists", resource: { label: "LeetCode: Linked List Explore Card", url: "https://leetcode.com/explore/learn/card/linked-list/" } },
    { id: "dsa6", text: "Stacks & queues", resource: { label: "LeetCode: Stack Tag", url: "https://leetcode.com/tag/stack/" } },
    { id: "dsa7", text: "Trees & binary search trees", resource: { label: "LeetCode: Tree Explore Card", url: "https://leetcode.com/explore/learn/card/data-structure-tree/" } },
    { id: "dsa8", text: "Heaps / priority queues", resource: { label: "LeetCode: Heap Tag", url: "https://leetcode.com/tag/heap-priority-queue/" } },
    { id: "dsa9", text: "Graphs: BFS/DFS", resource: { label: "LeetCode: Graph Explore Card", url: "https://leetcode.com/explore/learn/card/graph/" } },
    { id: "dsa10", text: "Dynamic programming fundamentals", resource: { label: "LeetCode: DP Explore Card", url: "https://leetcode.com/explore/learn/card/dynamic-programming/" } },
    { id: "dsa11", text: "Greedy algorithms", resource: { label: "LeetCode: Greedy Tag", url: "https://leetcode.com/tag/greedy/" } },
    { id: "dsa12", text: "Binary search patterns", resource: { label: "LeetCode: Binary Search Explore Card", url: "https://leetcode.com/explore/learn/card/binary-search/" } },
    { id: "dsa13", text: "Structured, interview-style practice sets", resource: { label: "HackerRank: Algorithms Domain", url: "https://www.hackerrank.com/domains/algorithms" } },
    { id: "dsa14", text: "Timed-contest rhythm (builds real interview pressure tolerance)", resource: { label: "Codeforces: Contests", url: "https://codeforces.com/contests" } },
    { id: "dsa15", text: "🎯 Milestone: 50+ problems solved across all three platforms combined", resource: null },
  ],
};

export const DEFAULT_CURRICULUM = {
  phases: DEFAULT_PHASES,
  bonus: DEFAULT_BONUS,
  parallelTrack: DEFAULT_PARALLEL_TRACK,
};

// Flat index of every curriculum item with its phase/section context.
// Used by the command palette and the heatmap aggregation. Computed once.
export const allItems = (() => {
  const out = [];
  for (const phase of DEFAULT_PHASES) {
    for (const w of phase.weeks) {
      for (const item of w.items) {
        out.push({
          ...item,
          phaseId: phase.id,
          phaseTitle: phase.title,
          week: w.week,
          weekTitle: w.title,
        });
      }
    }
  }
  for (const w of DEFAULT_BONUS.weeks) {
    for (const item of w.items) {
      out.push({
        ...item,
        phaseId: DEFAULT_BONUS.id,
        phaseTitle: DEFAULT_BONUS.title,
        week: w.week,
        weekTitle: w.title,
      });
    }
  }
  for (const item of DEFAULT_PARALLEL_TRACK.items) {
    out.push({
      ...item,
      phaseId: DEFAULT_PARALLEL_TRACK.id,
      phaseTitle: DEFAULT_PARALLEL_TRACK.title,
      week: null,
      weekTitle: null,
    });
  }
  return out;
})();

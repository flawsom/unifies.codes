import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";
import AccountBar from "./components/AccountBar";
import AdminPanel from "./components/AdminPanel";

// ---------------------------------------------------------------------------
// DATA: the bundled default curriculum, basic -> advanced -> staff/principal-level.
// This is the fallback used in guest mode and the seed for the `curriculum`
// table in Supabase. Admins can edit the live version from the Admin Panel.
// ---------------------------------------------------------------------------
const DEFAULT_PHASES = [
  {
    id: "p1",
    code: "01",
    title: "Python Foundations",
    sub: "Weeks 1\u20133 \u00b7 Days 1\u201321",
    weeks: [
      {
        week: 1,
        title: "Python From Zero, Fast",
        items: [
          { id: "p1w1i1", text: "Variables, data types, operators", resource: { label: "Python Tutorial \u00a73", url: "https://docs.python.org/3/tutorial/introduction.html" } },
          { id: "p1w1i2", text: "Control flow: if/else, for/while loops", resource: { label: "Python Tutorial \u00a74", url: "https://docs.python.org/3/tutorial/controlflow.html" } },
          { id: "p1w1i3", text: "Functions, default args, *args/**kwargs", resource: { label: "Python Docs: Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" } },
          { id: "p1w1i4", text: "Lists, tuples, dicts, sets + comprehensions", resource: { label: "Real Python: Lists & Tuples", url: "https://realpython.com/python-lists-tuples/" } },
          { id: "p1w1i5", text: "String formatting & f-strings", resource: { label: "Real Python: f-Strings", url: "https://realpython.com/python-f-strings/" } },
          { id: "p1w1i6", text: "Error handling: try/except/finally", resource: { label: "Python Tutorial: Errors", url: "https://docs.python.org/3/tutorial/errors.html" } },
          { id: "p1w1i7", text: "Virtual environments & pip", resource: { label: "Python Tutorial: venv", url: "https://docs.python.org/3/tutorial/venv.html" } },
          { id: "p1w1i8", text: "\ud83c\udfaf Milestone: Port your BPUT SGPA calculation to Python from scratch", resource: null },
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
          { id: "p1w2i8", text: "\ud83c\udfaf Milestone: CLI tool that cleans a messy CSV and outputs a report", resource: null },
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
          { id: "p1w3i5", text: "SQLAlchemy \u2014 connecting Python to Postgres", resource: { label: "SQLAlchemy: Unified Tutorial", url: "https://docs.sqlalchemy.org/en/20/tutorial/" } },
          { id: "p1w3i6", text: "Async basics in Python (async/await)", resource: { label: "Python Docs: asyncio tasks", url: "https://docs.python.org/3/library/asyncio-task.html" } },
          { id: "p1w3i7", text: "\ud83c\udfaf Milestone: FastAPI service querying Postgres, running locally", resource: null },
        ],
      },
    ],
  },
  {
    id: "p2",
    code: "02",
    title: "Cloud & Containers",
    sub: "Weeks 4\u20136 \u00b7 Days 22\u201342",
    weeks: [
      {
        week: 4,
        title: "Docker",
        items: [
          { id: "p2w4i1", text: "Images vs. containers, core concepts", resource: { label: "Docker: Overview", url: "https://docs.docker.com/get-started/docker-overview/" } },
          { id: "p2w4i2", text: "Writing a Dockerfile for a Python app", resource: { label: "Docker: Build Python Images", url: "https://docs.docker.com/language/python/build-images/" } },
          { id: "p2w4i3", text: "Volumes & networking basics", resource: { label: "Docker: Volumes", url: "https://docs.docker.com/storage/volumes/" } },
          { id: "p2w4i4", text: "Multi-stage builds (lean production images)", resource: { label: "Docker: Multi-Stage Builds", url: "https://docs.docker.com/build/building/multi-stage/" } },
          { id: "p2w4i5", text: "\ud83c\udfaf Milestone: Containerize the Week 3 FastAPI service", resource: null },
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
          { id: "p2w5i5", text: "(Stretch) Kubernetes the Hard Way \u2014 build intuition manually", resource: { label: "Kelsey Hightower: K8s the Hard Way", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way" } },
          { id: "p2w5i6", text: "\ud83c\udfaf Milestone: App + Postgres running together via Compose", resource: null },
        ],
      },
      {
        week: 6,
        title: "Cloud Platforms \u2014 AWS + GCP",
        items: [
          { id: "p2w6i1", text: "AWS ECS or EC2 deployment", resource: { label: "AWS: ECS Developer Guide", url: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html" } },
          { id: "p2w6i2", text: "AWS IAM basics (roles & policies)", resource: { label: "AWS: IAM Introduction", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" } },
          { id: "p2w6i3", text: "GCP Cloud Run basics", resource: { label: "Google Cloud: Cloud Run Docs", url: "https://cloud.google.com/run/docs" } },
          { id: "p2w6i4", text: "AWS \u2194 GCP service mapping (speak both dialects)", resource: { label: "Google Cloud: AWS/Azure/GCP Comparison", url: "https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison" } },
          { id: "p2w6i5", text: "\ud83c\udfaf Milestone: Deploy the same container to AWS AND GCP", resource: null },
        ],
      },
    ],
  },
  {
    id: "p3",
    code: "03",
    title: "The Integration Wall",
    sub: "Weeks 7\u20139 \u00b7 Days 43\u201363",
    weeks: [
      {
        week: 7,
        title: "Enterprise Authentication",
        items: [
          { id: "p3w7i1", text: "OAuth 2.0 fundamentals", resource: { label: "OAuth.net: OAuth 2.0", url: "https://oauth.net/2/" } },
          { id: "p3w7i2", text: "OIDC on top of OAuth", resource: { label: "OpenID: How Connect Works", url: "https://openid.net/developers/how-connect-works/" } },
          { id: "p3w7i3", text: "SAML fundamentals \u2014 the enterprise-specific gap", resource: { label: "Auth0: SAML Protocol", url: "https://auth0.com/docs/authenticate/protocols/saml" } },
          { id: "p3w7i4", text: "JWTs \u2014 structure, signing, verification", resource: { label: "JWT.io: Introduction", url: "https://jwt.io/introduction" } },
          { id: "p3w7i5", text: "\ud83c\udfaf Milestone: Write and teach back an OAuth vs OIDC vs SAML explainer", resource: null },
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
          { id: "p3w8i5", text: "\ud83c\udfaf Milestone: Pipeline pulling a real, messy public API into a clean schema", resource: null },
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
          { id: "p3w9i5", text: "\ud83c\udfaf Milestone: Design a privacy-preserving analytics layer for a new dataset, on paper", resource: null },
        ],
      },
    ],
  },
  {
    id: "p4",
    code: "04",
    title: "AI-Native Stack",
    sub: "Weeks 10\u201312 \u00b7 Days 64\u201384",
    weeks: [
      {
        week: 10,
        title: "LLM Fundamentals + RAG",
        items: [
          { id: "p4w10i1", text: "Embeddings & vector search fundamentals", resource: { label: "LangChain: Embedding Models", url: "https://python.langchain.com/docs/concepts/embedding_models/" } },
          { id: "p4w10i2", text: "Vector databases: pgvector (uses Postgres you know)", resource: { label: "pgvector on GitHub", url: "https://github.com/pgvector/pgvector" } },
          { id: "p4w10i3", text: "RAG pipeline architecture end to end", resource: { label: "LangChain: RAG Tutorial", url: "https://python.langchain.com/docs/tutorials/rag/" } },
          { id: "p4w10i4", text: "Chunking strategies", resource: { label: "Pinecone: Chunking Strategies", url: "https://www.pinecone.io/learn/chunking-strategies/" } },
          { id: "p4w10i5", text: "\ud83c\udfaf Milestone: RAG system over a real, messy dataset (not a tutorial sample)", resource: null },
        ],
      },
      {
        week: 11,
        title: "Agent Orchestration",
        items: [
          { id: "p4w11i1", text: "LangGraph fundamentals", resource: { label: "LangGraph Docs", url: "https://langchain-ai.github.io/langgraph/" } },
          { id: "p4w11i2", text: "CrewAI fundamentals (alternative framework)", resource: { label: "CrewAI Docs", url: "https://docs.crewai.com/" } },
          { id: "p4w11i3", text: "Tool / function calling patterns", resource: { label: "LangChain: Tool Calling Concepts", url: "https://python.langchain.com/docs/concepts/tool_calling/" } },
          { id: "p4w11i4", text: "\ud83c\udfaf Milestone: Ship one working multi-step agent, end to end", resource: null },
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
          { id: "p4w12i5", text: "\ud83c\udfaf Milestone: Eval suite (10\u201315 cases) for your Week 10\u201311 build", resource: null },
        ],
      },
    ],
  },
  {
    id: "p5",
    code: "05",
    title: "Portfolio & Interview",
    sub: "Week 13 \u00b7 Days 85\u201390",
    weeks: [
      {
        week: 13,
        title: "Consolidation",
        items: [
          { id: "p5w13i1", text: "Reframe BPUT Result Hub & Unify in FDE language (customer, ambiguity, ownership)", resource: null },
          { id: "p5w13i2", text: "Practice scoping vague, high-stakes problems out loud", resource: null },
          { id: "p5w13i3", text: "Run mock technical + behavioral interviews", resource: { label: "Pramp: Free Peer Mock Interviews", url: "https://www.pramp.com/" } },
          { id: "p5w13i4", text: "Update resume/LinkedIn specifically for FDE roles", resource: null },
          { id: "p5w13i5", text: "\ud83c\udfaf Milestone: Full narrative run-through of both projects, FDE-framed", resource: null },
        ],
      },
    ],
  },
];

const DEFAULT_BONUS = {
  id: "bonus",
  code: "\u2605",
  title: "Beyond Day 90: Staff / Principal-Level Mastery",
  sub: "Open-ended \u00b7 the top 1% track",
  weeks: [
    {
      week: "\u221e",
      title: "Where the Top Sit",
      items: [
        { id: "bi1", text: "Distributed systems fundamentals", resource: { label: "\u201cDesigning Data-Intensive Applications\u201d (Kleppmann)", url: "https://dataintensive.net/" } },
        { id: "bi2", text: "System design practice at real scale", resource: { label: "System Design Primer (GitHub)", url: "https://github.com/donnemartin/system-design-primer" } },
        { id: "bi3", text: "Technical writing & RFC authorship", resource: { label: "Google: Technical Writing Courses", url: "https://developers.google.com/tech-writing" } },
        { id: "bi4", text: "Open-source contribution", resource: { label: "Open Source Guide: How to Contribute", url: "https://opensource.guide/how-to-contribute/" } },
        { id: "bi5", text: "Applied AI systems at production scale", resource: { label: "Full Stack Deep Learning", url: "https://fullstackdeeplearning.com/" } },
        { id: "bi6", text: "ML systems design interviews & thinking", resource: { label: "Chip Huyen: ML Interviews Book", url: "https://huyenchip.com/ml-interviews-book/" } },
        { id: "bi7", text: "Negotiation & stakeholder management", resource: { label: "Harvard PON: Free Negotiation Reports", url: "https://www.pon.harvard.edu/free-reports/" } },
        { id: "bi8", text: "Public speaking / conference-level talks", resource: null },
        { id: "bi9", text: "Mentorship \u2014 building leverage through others", resource: null },
      ],
    },
  ],
};

const STORAGE_KEY = "fde-tracker-v1";

const DEFAULT_PARALLEL_TRACK = {
  id: "dsa",
  title: "Continuous Track: DSA & Competitive Programming",
  note: "Run this alongside every phase above \u2014 aim for 3\u20135 problems/week, not all at once at the end.",
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
    { id: "dsa15", text: "\ud83c\udfaf Milestone: 50+ problems solved across all three platforms combined", resource: null },
  ],
};

const DEFAULT_CURRICULUM = {
  phases: DEFAULT_PHASES,
  bonus: DEFAULT_BONUS,
  parallelTrack: DEFAULT_PARALLEL_TRACK,
};

export default function DeploymentTracker() {
  const { isSupabaseConfigured: authConfigured, authLoading, user } = useAuth();

  // --- curriculum (topics): bundled default, or the live version from Supabase ---
  const [curriculum, setCurriculum] = useState(DEFAULT_CURRICULUM);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from("curriculum")
      .select("data")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.data) setCurriculum(data.data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const PHASES = curriculum.phases || DEFAULT_PHASES;
  const BONUS = curriculum.bonus || DEFAULT_BONUS;
  const PARALLEL_TRACK = curriculum.parallelTrack || DEFAULT_PARALLEL_TRACK;
  const ALL_PHASES = useMemo(() => [...PHASES, BONUS], [PHASES, BONUS]);
  const CORE_IDS = useMemo(
    () => new Set(PHASES.flatMap((p) => p.weeks.flatMap((w) => w.items.map((i) => i.id)))),
    [PHASES]
  );
  const DSA_IDS = useMemo(() => new Set(PARALLEL_TRACK.items.map((i) => i.id)), [PARALLEL_TRACK]);

  // --- progress (checked items + mission start date): per-account in Supabase,
  // falls back to localStorage for guests / when Supabase isn't configured ---
  const [checked, setChecked] = useState({});
  const [startDate, setStartDate] = useState("");
  const [openPhase, setOpenPhase] = useState("p1");
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const refs = useRef({});

  // Load progress whenever the signed-in account changes (or once, for guests).
  useEffect(() => {
    if (authConfigured && authLoading) return; // wait for session check first
    let cancelled = false;
    setLoaded(false);

    const loadGuest = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!cancelled) {
            setChecked(parsed.checked || {});
            setStartDate(parsed.startDate || "");
          }
        } else if (!cancelled) {
          setChecked({});
          setStartDate("");
        }
      } catch (e) {
        // no saved state yet, or storage unavailable
      }
    };

    if (user && supabase) {
      supabase
        .from("progress")
        .select("checked, start_date")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (!error && data) {
            setChecked(data.checked || {});
            setStartDate(data.start_date || "");
          } else {
            setChecked({});
            setStartDate("");
          }
        })
        .finally(() => !cancelled && setLoaded(true));
    } else {
      loadGuest();
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [user, authConfigured, authLoading]);

  // Persist progress: to Supabase (per account) or localStorage (guest).
  useEffect(() => {
    if (!loaded) return;

    if (user && supabase) {
      const handle = setTimeout(() => {
        supabase
          .from("progress")
          .upsert({
            user_id: user.id,
            checked,
            start_date: startDate,
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => setSaveError(Boolean(error)));
      }, 500); // debounce writes while checking multiple boxes quickly
      return () => clearTimeout(handle);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked, startDate }));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, [checked, startDate, loaded, user]);

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const coreDone = useMemo(
    () => Object.keys(checked).filter((k) => checked[k] && CORE_IDS.has(k)).length,
    [checked]
  );
  const coreTotal = CORE_IDS.size;
  const corePct = Math.round((coreDone / coreTotal) * 100);

  const bonusDone = Object.keys(checked).filter(
    (k) => checked[k] && !CORE_IDS.has(k) && !DSA_IDS.has(k)
  ).length;
  const bonusTotal = BONUS.weeks.flatMap((w) => w.items).length;

  const dsaDone = Object.keys(checked).filter((k) => checked[k] && DSA_IDS.has(k)).length;
  const dsaTotal = PARALLEL_TRACK.items.length;
  const dsaPct = Math.round((dsaDone / dsaTotal) * 100);

  const dayInfo = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    return { elapsed: Math.max(diff, 0), remaining: Math.max(90 - diff, 0) };
  }, [startDate]);

  const phasePct = (phase) => {
    const ids = phase.weeks.flatMap((w) => w.items.map((i) => i.id));
    const done = ids.filter((id) => checked[id]).length;
    return ids.length ? Math.round((done / ids.length) * 100) : 0;
  };

  const scrollTo = (id) => {
    setOpenPhase(id);
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {showAdmin && <AdminPanel defaultCurriculum={DEFAULT_CURRICULUM} onClose={() => setShowAdmin(false)} />}
      {/* MISSION HEADER */}
      <div className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-5 py-5">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-amber-400 uppercase">Deployment Log</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">FDE Readiness \u2014 90 Day Route</h1>
            </div>
            <div className="flex items-center gap-5">
              <AccountBar onOpenAdmin={() => setShowAdmin(true)} />
              <div className="text-right">
                <div className="font-mono text-3xl font-bold text-amber-400 tabular-nums">{corePct}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">core route complete</div>
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-4 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${corePct}%` }}
            />
          </div>

          {/* day counter */}
          <div className="mt-4 flex items-center gap-4 flex-wrap font-mono text-xs">
            <label className="flex items-center gap-2 text-slate-400">
              MISSION START:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </label>
            {dayInfo && (
              <>
                <span className="text-cyan-400">DAY {dayInfo.elapsed} / 90</span>
                <span className="text-slate-500">{dayInfo.remaining} days remaining</span>
              </>
            )}
            {saveError && <span className="text-red-400">progress not saving \u2014 browser storage may be disabled</span>}
          </div>
        </div>

        {/* DEPLOYMENT ROUTE (signature element) */}
        <div className="max-w-4xl mx-auto px-5 pb-5 overflow-x-auto">
          <div className="flex items-center min-w-[600px]">
            {ALL_PHASES.map((phase, idx) => {
              const pct = phasePct(phase);
              const complete = pct === 100;
              const isOpen = openPhase === phase.id;
              return (
                <React.Fragment key={phase.id}>
                  <button
                    onClick={() => scrollTo(phase.id)}
                    className="flex flex-col items-center gap-2 group flex-shrink-0"
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-colors
                        ${complete ? "bg-amber-500 border-amber-500 text-slate-950" : isOpen ? "border-cyan-400 text-cyan-400" : "border-slate-700 text-slate-500 group-hover:border-slate-500"}`}
                    >
                      {phase.code}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide w-20 text-center ${isOpen ? "text-cyan-400" : "text-slate-500"}`}>
                      {phase.title}
                    </span>
                  </button>
                  {idx < ALL_PHASES.length - 1 && (
                    <div className={`flex-1 h-px mb-6 ${phasePct(ALL_PHASES[idx]) === 100 ? "bg-amber-500" : "bg-slate-800"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* PARALLEL TRACK: DSA & Competitive Programming */}
      <div className="max-w-4xl mx-auto px-5 pt-8">
        <div className="bg-slate-900/60 border border-cyan-900/50 rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <p className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Parallel Ops</p>
              <h2 className="text-lg font-bold text-slate-50">{PARALLEL_TRACK.title}</h2>
            </div>
            <div className="font-mono text-lg text-cyan-400 tabular-nums">{dsaPct}%</div>
          </div>
          <p className="text-xs text-slate-500 mb-4">{PARALLEL_TRACK.note}</p>
          <ul className="space-y-2">
            {PARALLEL_TRACK.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggle(item.id)}
                  className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                    ${checked[item.id] ? "bg-cyan-500 border-cyan-500" : "border-slate-600 hover:border-slate-400"}`}
                >
                  {checked[item.id] && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-slate-950">
                      <path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${checked[item.id] ? "text-slate-500 line-through" : "text-slate-200"}`}>
                    {item.text}
                  </p>
                  {item.resource && (
                    <a
                      href={item.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-xs font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      {item.resource.label} \u2192
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* PHASE SECTIONS */}
      <div className="max-w-4xl mx-auto px-5 py-8 space-y-14">
        {ALL_PHASES.map((phase) => (
          <section key={phase.id} ref={(el) => (refs.current[phase.id] = el)}>
            <div className="flex items-baseline justify-between border-b border-slate-800 pb-3 mb-6">
              <div>
                <p className="font-mono text-xs text-amber-400 tracking-widest">{phase.code}</p>
                <h2 className="text-xl font-bold text-slate-50">{phase.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{phase.sub}</p>
              </div>
              <div className="font-mono text-lg text-slate-400 tabular-nums">{phasePct(phase)}%</div>
            </div>

            <div className="space-y-6">
              {phase.weeks.map((w) => (
                <div key={String(phase.id) + w.week} className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded">
                      WEEK {w.week}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-200">{w.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {w.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(item.id)}
                          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                            ${checked[item.id] ? "bg-amber-500 border-amber-500" : "border-slate-600 hover:border-slate-400"}`}
                        >
                          {checked[item.id] && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-slate-950">
                              <path d="M4.5 8.5L2 6l-1 1 3.5 3.5L11 3l-1-1z" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${checked[item.id] ? "text-slate-500 line-through" : "text-slate-200"}`}>
                            {item.text}
                          </p>
                          {item.resource && (
                            <a
                              href={item.resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                            >
                              {item.resource.label} \u2192
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center text-xs text-slate-600 font-mono pt-6 border-t border-slate-800">
          {coreDone}/{coreTotal} core items \u00b7 {dsaDone}/{dsaTotal} DSA problems \u00b7 {bonusDone}/{bonusTotal} staff-level items \u00b7 progress saved automatically
        </div>
      </div>
    </div>
  );
}

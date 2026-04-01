import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, FileText, Eye, ThumbsUp, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Status = "APPROVED" | "NEEDS_REVIEW" | "DRAFTED";

interface QuestionItem {
  id: number;
  question: string;
  status: Status;
  answer: string;
  confidence: number;
  citations: { source: string; section: string; snippet: string; score: number }[];
}

const questions: QuestionItem[] = [
  {
    id: 1,
    question: "How is customer data isolated in your multi-tenant environment?",
    status: "NEEDS_REVIEW",
    answer:
      "Customer data is logically isolated using schema-level separation within Amazon Aurora. Each tenant's data resides in a dedicated schema with enforced Row-Level Security (RLS) policies. Network isolation is achieved via private VPC subnets with security groups restricting cross-tenant traffic. All inter-service communication is encrypted using TLS 1.3.",
    confidence: 0.92,
    citations: [
      { source: "Security_Policy.pdf", section: "§3.1 – Multi-Tenancy Architecture", snippet: "Each customer environment is logically isolated at the database schema level with enforced RLS policies…", score: 0.94 },
      { source: "Infrastructure_Guide.pdf", section: "§5.4 – Network Isolation", snippet: "Private VPC subnets with dedicated security groups restrict all cross-tenant network traffic…", score: 0.89 },
      { source: "Encryption_Standard.pdf", section: "§2.1 – In-Transit Encryption", snippet: "All inter-service communication uses TLS 1.3 with certificate pinning…", score: 0.85 },
    ],
  },
  {
    id: 2,
    question: "How is data encrypted at rest?",
    status: "APPROVED",
    answer:
      "All data at rest is encrypted using AES-256 via AWS KMS managed keys. Database volumes on Amazon Aurora use encrypted EBS storage. S3 buckets enforce SSE-S3 encryption with bucket policies preventing unencrypted uploads. Key rotation occurs automatically every 365 days.",
    confidence: 0.97,
    citations: [
      { source: "Security_Policy.pdf", section: "§4.2 – Data Encryption at Rest", snippet: "All persistent data stores utilize AES-256 encryption via AWS Key Management Service…", score: 0.97 },
      { source: "Compliance_Matrix.pdf", section: "§1.3 – SOC 2 Controls", snippet: "Encryption at rest is enforced across all storage services including Aurora, S3, and EBS…", score: 0.91 },
    ],
  },
  {
    id: 3,
    question: "Describe your incident response process.",
    status: "DRAFTED",
    answer:
      "Our incident response follows a 4-phase NIST framework: Preparation, Detection & Analysis, Containment & Eradication, and Post-Incident Recovery. Alerts from CloudWatch and GuardDuty trigger automated PagerDuty escalations. The security team targets a 15-minute initial response SLA for P1 incidents.",
    confidence: 0.78,
    citations: [
      { source: "IR_Playbook.pdf", section: "§1.0 – Response Framework", snippet: "Incident response follows the NIST 800-61 framework with four defined phases…", score: 0.82 },
      { source: "SLA_Document.pdf", section: "§2.5 – Response Times", snippet: "P1 critical incidents carry a 15-minute initial response SLA…", score: 0.74 },
    ],
  },
  {
    id: 4,
    question: "What access controls are in place for production systems?",
    status: "APPROVED",
    answer:
      "Production access is governed by a zero-trust model with SSO via Okta and mandatory MFA. Engineers require just-in-time (JIT) access approved through PagerDuty's escalation workflow. All production sessions are recorded and audited quarterly.",
    confidence: 0.95,
    citations: [
      { source: "Access_Control_Policy.pdf", section: "§2.0 – Production Access", snippet: "Zero-trust architecture enforces SSO with MFA for all production system access…", score: 0.95 },
    ],
  },
  {
    id: 5,
    question: "How do you handle vulnerability management?",
    status: "NEEDS_REVIEW",
    answer:
      "Vulnerability scanning runs continuously via AWS Inspector and Snyk for application dependencies. Critical vulnerabilities (CVSS ≥ 9.0) require remediation within 48 hours per our SLA. Weekly scan reports are reviewed by the security team and tracked in Jira.",
    confidence: 0.88,
    citations: [
      { source: "Vuln_Mgmt_Policy.pdf", section: "§3.2 – Scanning Cadence", snippet: "Continuous scanning is performed using AWS Inspector for infrastructure and Snyk for dependencies…", score: 0.90 },
      { source: "SLA_Document.pdf", section: "§4.1 – Remediation Timelines", snippet: "Critical vulnerabilities with CVSS score ≥ 9.0 must be remediated within 48 hours…", score: 0.86 },
    ],
  },
];

const statusConfig: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  APPROVED: { label: "Approved", bg: "bg-emerald_custom-light", text: "text-emerald_custom", dot: "bg-emerald_custom" },
  NEEDS_REVIEW: { label: "Review", bg: "bg-amber_custom-light", text: "text-amber_custom", dot: "bg-amber_custom" },
  DRAFTED: { label: "Drafted", bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
};

const ReviewMockup = () => {
  const [activeId, setActiveId] = useState(1);
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(questions.map((q) => [q.id, q.status]))
  );

  const active = questions.find((q) => q.id === activeId)!;
  const currentStatus = statuses[activeId];

  const handleApprove = () => {
    setStatuses((s) => ({ ...s, [activeId]: "APPROVED" }));
    toast({ title: "✅ Answer Approved", description: "Answer verified and synced to knowledge base." });
  };

  const handleReject = () => {
    setStatuses((s) => ({ ...s, [activeId]: "NEEDS_REVIEW" }));
    toast({ title: "🔄 Sent to Review", description: "Answer flagged for manual review." });
  };

  return (
    <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[520px]">
        {/* Sidebar */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Questionnaire Items
          </p>
          <div className="space-y-1.5">
            {questions.map((q) => {
              const s = statusConfig[statuses[q.id]];
              const isActive = q.id === activeId;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveId(q.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-xs transition-all ${
                    isActive
                      ? "bg-card border border-border shadow-sm"
                      : "hover:bg-card/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground leading-snug line-clamp-2">
                      {q.question}
                    </span>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[currentStatus].dot}`} />
                    {statusConfig[currentStatus].label}
                  </span>
                  <span className="text-xs text-muted-foreground">Q{activeId} of {questions.length}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {active.question}
                </h3>
              </div>

              {/* Answer */}
              <div className="mb-6 rounded-xl border border-border bg-muted/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Generated Answer
                  </p>
                  {/* Confidence Badge */}
                  <div className="flex items-center gap-2">
                    <div className="relative h-9 w-9">
                      <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={active.confidence >= 0.9 ? "hsl(var(--emerald))" : active.confidence >= 0.65 ? "hsl(var(--amber-warning))" : "hsl(var(--destructive))"}
                          strokeWidth="3"
                          strokeDasharray={`${active.confidence * 94.2} 94.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                        {Math.round(active.confidence * 100)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium leading-tight">
                      Confidence<br />Score
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {active.answer}
                </p>
              </div>

              {/* Citations */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Source Evidence
                </p>
                <div className="space-y-2">
                  {active.citations.map((c, i) => (
                    <div key={i} className="group rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{c.source}</span>
                          <span className="text-[10px] text-muted-foreground">{c.section}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.score >= 0.9 ? "bg-emerald_custom-light text-emerald_custom" : "bg-amber_custom-light text-amber_custom"
                        }`}>
                          {c.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "{c.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button size="sm" onClick={handleApprove} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleReject} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ReviewMockup;

import { useEffect, useState } from 'react';
import { AgentStep } from '../components/AgentOrchestrationTrace';

export const useAgentMock = (questionId?: number, isActive?: boolean) => {
  const [steps, setSteps] = useState<AgentStep[]>([]);

  useEffect(() => {
    if (!isActive) return;

    let stepIndex = 0;
    const stepData: AgentStep[] = [
      {
        id: 'intake-analyzing',
        agent: 'Intake Agent',
        status: 'processing',
        message: 'Analyzing question intent...',
        details: 'Classifying: "Governance" category, expanding to include related compliance topics',
        timestamp: new Date(),
      },
      {
        id: 'intake-complete',
        agent: 'Intake Agent',
        status: 'completed',
        message: 'Query expanded and categorized',
        details: 'Category: Governance | Expanded Query: "...security policy governance framework"',
        timestamp: new Date(),
      },
      {
        id: 'retrieval-searching',
        agent: 'Retrieval Agent',
        status: 'processing',
        message: 'Searching Pinecone vector database...',
        details: 'Generating embeddings and searching 2,847 document chunks',
        timestamp: new Date(),
      },
      {
        id: 'retrieval-found',
        agent: 'Retrieval Agent',
        status: 'completed',
        message: 'Found 6 relevant chunks with semantic similarity',
        details: 'Top match: Security_Policy.pdf (98% similarity) | Avg confidence: 0.87',
        timestamp: new Date(),
      },
      {
        id: 'drafter-generating',
        agent: 'Drafter Agent (Mistral-7B)',
        status: 'processing',
        message: 'Generating comprehensive answer...',
        details: 'Using retrieved context to compose answer (1,024 tokens max)',
        timestamp: new Date(),
      },
      {
        id: 'drafter-complete',
        agent: 'Drafter Agent (Mistral-7B)',
        status: 'completed',
        message: 'Answer generated with citations',
        details: 'Generated 387 tokens | 4 citations integrated | Formatting applied',
        timestamp: new Date(),
      },
      {
        id: 'critic-validating',
        agent: 'Critic Agent',
        status: 'processing',
        message: 'Validating answer quality and source relevance...',
        details: 'Checking factual accuracy, citation validity, and response completeness',
        timestamp: new Date(),
      },
      {
        id: 'critic-complete',
        agent: 'Critic Agent',
        status: 'completed',
        message: 'Verification complete',
        details: 'Status: PASS | Confidence: 0.92 | Reason: All claims verified against source material',
        timestamp: new Date(),
      },
    ];

    // Simulate sequential agent execution
    const interval = setInterval(() => {
      if (stepIndex < stepData.length) {
        const currentSteps = stepData.slice(0, stepIndex + 1);
        
        // Mark previous step as completed
        if (stepIndex > 0) {
          currentSteps[stepIndex - 1].status = 'completed';
        }

        setSteps(currentSteps);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, questionId]);

  return steps;
};

// Example mock questions for demo
export const MOCK_QUESTIONS = [
  {
    id: 1,
    question: 'What is the company\'s policy on data encryption at rest?',
    answer:
      'All data at rest is encrypted using AES-256 via Gemini-managed key services. Database volumes use encrypted EBS storage. The encryption key rotation occurs automatically every 365 days, and all S3-equivalent storage enforces encryption with bucket policies preventing unencrypted uploads.',
    confidenceScore: 0.92,
    intakeCategory: 'Security Governance',
    expandedQuery:
      'encryption at rest, data protection, AES-256, key management, compliance',
    processingTimeMs: 3847,
    criticReasoning:
      'Verified against Section 4.2 of the Data Encryption Policy - 98% content match. All claims are directly cited in source material. No conflicting information found.',
    sources: [
      {
        source: 'Data_Encryption_Policy.pdf',
        section: '§4.2 – Encryption at Rest',
        snippet:
          'All persistent data stores utilize AES-256 encryption with automatic key rotation every 365 days',
        score: 0.98,
      },
      {
        source: 'Security_Policy.pdf',
        section: '§2.1 – Data Protection Requirements',
        snippet:
          'Storage encryption must meet or exceed industry standards (AES-256 minimum)',
        score: 0.94,
      },
      {
        source: 'Compliance_Matrix.pdf',
        section: '§5 – Encryption Standards',
        snippet: 'Encryption at rest: AES-256 with annual key rotation',
        score: 0.87,
      },
    ],
  },
  {
    id: 2,
    question: 'How are vulnerability scans performed and reported?',
    answer:
      'Vulnerability scanning runs continuously using automated tools that scan both infrastructure and application dependencies. Critical vulnerabilities (CVSS ≥ 9.0) require remediation within 48 hours per our SLA. Weekly scan reports are reviewed by the security team and tracked in our incident management system.',
    confidenceScore: 0.88,
    intakeCategory: 'Vulnerability Management',
    expandedQuery: 'vulnerability scanning, CVSS, remediation, SLA, security scanning',
    processingTimeMs: 3214,
    criticReasoning:
      'Verified across 3 policy documents. CVSS threshold and 48-hour SLA are consistently mentioned. Good alignment with industry standards.',
    sources: [
      {
        source: 'Vuln_Mgmt_Policy.pdf',
        section: '§3.2 – Scanning Cadence',
        snippet:
          'Continuous scanning is performed using industry-standard vulnerability scanners for infrastructure and dependencies',
        score: 0.96,
      },
      {
        source: 'SLA_Definitions.pdf',
        section: '§2 – Critical Remediation',
        snippet: 'Critical vulnerabilities (CVSS ≥ 9.0) must be remediated within 48 hours',
        score: 0.94,
      },
    ],
  },
  {
    id: 3,
    question: 'What authentication methods are supported?',
    answer:
      'The system supports multiple authentication methods including OAuth 2.0 for third-party integrations, SAML 2.0 for enterprise SSO, and multi-factor authentication (MFA) with TOTP-based codes. All authentication flows are logged and monitored for security anomalies.',
    confidenceScore: 0.85,
    intakeCategory: 'Access Control',
    expandedQuery: 'authentication, OAuth, SAML, MFA, SSO, identity management',
    processingTimeMs: 2956,
    criticReasoning:
      'Most information verified. OAuth and SAML are explicitly mentioned. MFA requirement is implied in security policies.',
    sources: [
      {
        source: 'Authentication_Framework.pdf',
        section: '§4 – Supported Methods',
        snippet: 'Supported authentication methods: OAuth 2.0, SAML 2.0, and local credentials',
        score: 0.93,
      },
      {
        source: 'Security_Policy.pdf',
        section: '§3.4 – Multi-Factor Authentication',
        snippet: 'MFA is required for all user accounts with sensitive access',
        score: 0.89,
      },
    ],
  },
];

import { motion } from "framer-motion";
import { FileText, Database, Brain, ShieldCheck, Link2, ArrowRight, Upload, FileSearch, Layers, Server, RefreshCw, Gauge, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

const pipelineSteps = [
  { label: "Upload", icon: Upload, color: "bg-primary/10 text-primary" },
  { label: "S3", icon: Server, color: "bg-amber_custom-light text-amber_custom" },
  { label: "Textract", icon: FileSearch, color: "bg-amber_custom-light text-amber_custom" },
  { label: "LangChain\nChunking", icon: Layers, color: "bg-primary/10 text-primary" },
  { label: "Bedrock\nTitan", icon: Brain, color: "bg-emerald_custom-light text-emerald_custom" },
  { label: "Aurora DB", icon: Database, color: "bg-emerald_custom-light text-emerald_custom" },
];

const TechnicalDeepDive = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-hero pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            className="font-display text-4xl font-bold text-gradient-hero md:text-5xl lg:text-6xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            The Architecture of Trust.
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-indigo-light"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            A transparent, auditable AWS-native pipeline from document ingestion to verified answer.
          </motion.p>
        </div>
      </section>

      {/* The Pipeline */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-center font-display text-3xl font-bold text-foreground mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            The Pipeline
          </motion.h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: FileSearch,
                title: "Ingestion & OCR",
                subtitle: "Amazon Textract",
                description: "Security policies, SOC 2 reports, and complex PDF questionnaires are parsed using Amazon Textract's OCR engine, extracting structured text from even the messiest document formats.",
              },
              {
                step: "02",
                icon: Database,
                title: "Vector Storage",
                subtitle: "Amazon Aurora (pgvector)",
                description: "Document chunks are embedded into 1536-dimensional vectors using Bedrock Titan Text Embeddings and stored in Amazon Aurora with pgvector for high-speed semantic retrieval.",
              },
              {
                step: "03",
                icon: Brain,
                title: "Reasoning",
                subtitle: "Amazon Bedrock · Claude 3.5 Sonnet",
                description: "The AI agent uses Amazon Bedrock Knowledge Bases with Claude 3.5 Sonnet to retrieve relevant context and generate policy-grounded answers with source citations.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="relative bg-card-gradient rounded-xl border border-border p-8 shadow-card hover:shadow-elevated transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <span className="absolute top-4 right-4 font-display text-5xl font-bold text-muted/60">
                  {item.step}
                </span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs font-medium text-accent">{item.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                {i < 2 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Pipeline Visualization */}
      <section className="bg-card py-24 border-y border-border">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-center font-display text-3xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Data Pipeline
          </motion.h2>
          <motion.p
            className="text-center text-muted-foreground mb-16 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            End-to-end document processing from upload to queryable knowledge base.
          </motion.p>

          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
              {pipelineSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  className="flex items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${step.color}`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center whitespace-pre-line leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground hidden md:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-center font-display text-3xl font-bold text-foreground mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Technical Features
          </motion.h2>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* BullMQ/Redis */}
            <motion.div
              className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber_custom-light">
                <Server className="h-6 w-6 text-amber_custom" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">BullMQ Orchestration</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Background processing powered by <strong className="text-foreground">BullMQ and Redis</strong> handles
                50+ enterprise questionnaires simultaneously without performance degradation.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs font-mono text-muted-foreground">
                  Queue → Worker Pool → Chunking → Embedding → Store
                </p>
              </div>
            </motion.div>

            {/* Feedback Loop */}
            <motion.div
              className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">Human Feedback Loop</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                When reviewers edit an AI-generated answer, the corrected version is <strong className="text-foreground">re-embedded and stored</strong> back
                into the vector database, continuously improving future retrieval accuracy.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
                <RefreshCw className="h-3.5 w-3.5" />
                Self-improving knowledge base
              </div>
            </motion.div>

            {/* Confidence Threshold */}
            <motion.div
              className="rounded-xl border border-border bg-card-gradient p-8 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <Gauge className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">Confidence Threshold</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Answers scoring below a <strong className="text-foreground">0.65 confidence threshold</strong> are
                automatically routed to the Review Gate, ensuring no low-confidence response is ever auto-approved.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Below 0.65 → Manual Review Required
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Safeguards */}
      <section className="bg-card py-24 border-y border-border">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-center font-display text-3xl font-bold text-foreground mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trust Safeguards
          </motion.h2>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <motion.div
              className="rounded-xl border border-border bg-background p-8 shadow-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald_custom-light">
                <ShieldCheck className="h-6 w-6 text-emerald_custom" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">Review Gate</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Exports are blocked until <strong className="text-foreground">100% of answers</strong> have been
                human-verified. No draft answer leaves the system without explicit approval.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald_custom-light px-4 py-2 text-xs font-medium text-emerald_custom">
                <ShieldCheck className="h-3.5 w-3.5" />
                All items must be APPROVED to export
              </div>
            </motion.div>

            <motion.div
              className="rounded-xl border border-border bg-background p-8 shadow-card"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">Auto-Citations</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Every generated answer links directly to its <strong className="text-foreground">source documentation</strong>.
                Reviewers can verify any claim in one click.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-primary">Source:</span> Security_Policy.pdf → Section 4.2: "Data Encryption at Rest"
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TechnicalDeepDive;

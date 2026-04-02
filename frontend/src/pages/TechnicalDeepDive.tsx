import { motion } from "framer-motion";
import { Database, Brain, ShieldCheck, ArrowRight, Code, Server, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

const TechnicalDeepDive = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            className="font-display text-4xl font-bold md:text-5xl lg:text-6xl text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            TrustFlow Architecture
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Multi-agent LLM architecture: Intake → Retrieval → Drafter → Critic
          </motion.p>
        </div>
      </section>

      {/* System Components */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold mb-12">System Components</h2>

          <div className="grid gap-6 lg:grid-cols-3 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>React + Vite + TypeScript</p>
                <p>Tailwind CSS + shadcn/ui</p>
                <p>Port: 8082</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>NestJS + Express</p>
                <p>Prisma ORM + PostgreSQL</p>
                <p>Port: 3000</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Layer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>PostgreSQL Database</p>
                <p>Pinecone Vector DB</p>
                <p>Redis + BullMQ Queue</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4-Agent Pipeline */}
      <section className="py-24 bg-card border-y">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold mb-12">The 4-Agent Pipeline</h2>

          <div className="max-w-5xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                title: "Intake Agent",
                desc: "Classifies & expands queries",
                service: "Gemini API"
              },
              {
                num: "02",
                title: "Retrieval Agent",
                desc: "Searches knowledge base",
                service: "Pinecone Vector DB"
              },
              {
                num: "03",
                title: "Drafter Agent",
                desc: "Generates answers",
                service: "Mistral-7B (HuggingFace)"
              },
              {
                num: "04",
                title: "Critic Agent",
                desc: "Validates & scores",
                service: "Gemini API"
              },
            ].map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-2">{agent.num}</div>
                    <h3 className="font-semibold mb-2">{agent.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{agent.desc}</p>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded w-fit">
                      {agent.service}
                    </div>
                  </CardContent>
                </Card>
                {i < 3 && (
                  <ArrowRight className="hidden lg:block absolute -right-4 top-1/3 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Confidence Scoring */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-center text-3xl font-bold mb-12">Confidence Scoring</h2>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How Confidence is Calculated</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold">Source Relevance (40%)</p>
                    <p className="text-sm text-muted-foreground">Average similarity of retrieved chunks</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold">Content Overlap (30%)</p>
                    <p className="text-sm text-muted-foreground">Key phrases from sources in answer</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold">Answer Specificity (20%)</p>
                    <p className="text-sm text-muted-foreground">Length and detail level</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-semibold">Source Count (10%)</p>
                    <p className="text-sm text-muted-foreground">Number of supporting sources</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">≥ 80%</div>
              <div className="text-xs text-emerald-600/70 mt-2">HIGH - Ready to Approve</div>
            </div>
            <div className="rounded-lg border-2 border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">60-79%</div>
              <div className="text-xs text-yellow-600/70 mt-2">MEDIUM - Review Recommended</div>
            </div>
            <div className="rounded-lg border-2 border-red-500/30 bg-red-50 dark:bg-red-950/20 p-4 text-center">
              <div className="text-3xl font-bold text-red-600">&lt; 60%</div>
              <div className="text-xs text-red-600/70 mt-2">LOW - Needs Attention</div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="py-24 bg-card border-t">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold mb-12">Performance & Trust</h2>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Speed
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Per Question:</strong> 3-8 seconds</p>
                <p><strong>Parallel:</strong> BullMQ processing</p>
                <p><strong>Queue:</strong> Redis-backed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Safeguards
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Human Review:</strong> 100% approval required</p>
                <p><strong>Auto-Citations:</strong> Source-linked answers</p>
                <p><strong>Confidence Filter:</strong> &lt;60% flagged</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  LLM Models
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Intake/Critic:</strong> Gemini-1.5-Flash</p>
                <p><strong>Embeddings:</strong> Gemini Text-Embedding-004</p>
                <p><strong>Drafter:</strong> Mistral-7B</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><strong>Questions:</strong> Multi-domain</p>
                <p><strong>Sources:</strong> Company policies</p>
                <p><strong>Scope:</strong> GRC compliance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechnicalDeepDive;

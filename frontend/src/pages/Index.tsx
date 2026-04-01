import { motion } from "framer-motion";
import { ArrowRight, Clock, Users, AlertTriangle, Bot, Eye, ShieldCheck, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewMockup from "@/components/ReviewMockup";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-24">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="container relative mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald_custom/30 bg-emerald_custom-light px-4 py-1.5 text-xs font-medium text-emerald_custom">
              <ShieldCheck className="h-3.5 w-3.5" />
              AI-Powered GRC Automation
            </span>
          </motion.div>

          <motion.h1
            className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-tight tracking-tight text-gradient-hero md:text-6xl lg:text-7xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Close Enterprise Deals 10x Faster.
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-indigo-light"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Automate 80% of security questionnaires with a fact-grounded AI agent
            that cites your internal policies.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold px-8">
              <Link to="/projects">Open Reviewer Console</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-indigo-light/30 text-indigo-light hover:bg-indigo-light/10 font-display">
              <Link to="/technical">
                Technical Specs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              The Problem
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Security reviews are the #1 bottleneck killing enterprise sales velocity.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "20–40 Hours Per Questionnaire",
                description: "Security teams spend weeks manually answering repetitive questions across hundreds of fields.",
              },
              {
                icon: Users,
                title: "1–2 Full-Time Employees",
                description: "Companies dedicate entire headcount just for manual data entry into security review portals.",
              },
              {
                icon: AlertTriangle,
                title: "Deals Stall & Revenue Lost",
                description: "Slow responses push enterprise deals past quarter deadlines, directly impacting revenue targets.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-card-gradient rounded-xl border border-border p-8 shadow-card transition-shadow hover:shadow-elevated"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <item.icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="bg-card py-24 border-y border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Bot className="h-3.5 w-3.5" />
              Interactive Preview
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              The TrustFlow Review Suite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              See how AI-drafted answers are reviewed, cited, and approved—all in one interface.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ReviewMockup />
          </motion.div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-background p-1 shadow-elevated">
            <div className="rounded-xl bg-hero p-8 text-center">
              <div className="flex items-center justify-center gap-8 text-indigo-light">
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-gradient-hero">80%</p>
                  <p className="mt-1 text-xs">Automation Rate</p>
                </div>
                <div className="h-12 w-px bg-indigo-light/20" />
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-gradient-hero">10x</p>
                  <p className="mt-1 text-xs">Faster Turnaround</p>
                </div>
                <div className="h-12 w-px bg-indigo-light/20" />
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-gradient-hero">0</p>
                  <p className="mt-1 text-xs">Hallucinations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Built for Trust, Not Just Speed
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Human-in-the-Loop Review",
                description: "Every AI-generated answer requires explicit human approval before it can be exported or submitted.",
                color: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                icon: ShieldCheck,
                title: "Zero Hallucination RAG",
                description: "Closed-Context retrieval ensures answers are grounded only in your uploaded policies—never fabricated.",
                color: "bg-emerald_custom-light",
                iconColor: "text-emerald_custom",
              },
              {
                icon: BarChart3,
                title: "Automated Confidence Scoring",
                description: "Every response includes a similarity-based confidence score so reviewers know exactly where to focus.",
                color: "bg-amber_custom-light",
                iconColor: "text-amber_custom",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-card-gradient rounded-xl border border-border p-8 shadow-card transition-shadow hover:shadow-elevated"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

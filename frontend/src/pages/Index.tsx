import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Users,
  AlertTriangle,
  Bot,
  Eye,
  ShieldCheck,
  BarChart3,
  Zap,
  CheckCircle2,
  FileText,
  Search,
  MoreHorizontal,
  Download,
  TrendingUp,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 dark:bg-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 dark:bg-cyan-900/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center space-y-8" initial="hidden" animate="visible">
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mx-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700"
            >
              <Zap className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                Enterprise GRC Automation
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={fadeUp} custom={1} className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Answer Security Questions
                </span>
                <br />
                <span className="text-slate-900 dark:text-white">in Minutes, Not Weeks</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Stop spending weeks on security questionnaires. TrustFlow uses AI to draft answers grounded in your policies, with built-in human review for zero hallucinations.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold h-12 px-8"
                asChild
              >
                <Link to="/projects" className="flex items-center gap-2">
                  Start Review <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 h-12 px-8"
                asChild
              >
                <Link to="/technical">View Technical Specs</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800"
            >
              {[
                { label: "Faster", value: "10x" },
                { label: "Questions Answered", value: "80%" },
                { label: "Hallucinations", value: "0" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-cyan-400">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 sm:py-32 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              The Challenge Every Enterprise Faces
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Security questionnaires are slowing down your deals. Here's why:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Weeks of Manual Work",
                description: "Security teams spend 20-40 hours per questionnaire manually typing responses.",
                color: "red",
              },
              {
                icon: Users,
                title: "Dedicated Headcount",
                description: "Companies need 1-2 full-time employees just handling security reviews.",
                color: "orange",
              },
              {
                icon: AlertTriangle,
                title: "Lost Revenue",
                description: "Delayed responses push enterprise deals past quarter deadlines.",
                color: "amber",
              },
            ].map((item, i) => {
              const colorClasses = {
                red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900",
                orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900",
                amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900",
              };

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`rounded-xl border p-8 ${colorClasses[item.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-start gap-4">
                    <item.icon className="h-8 w-8 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              How TrustFlow Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Simple workflow. Maximum control. Zero hallucinations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: FileText,
                title: "Upload Policies",
                description: "Feed internal policies, SOPs, and documentation into the knowledge base.",
              },
              {
                step: "2",
                icon: Search,
                title: "Semantic Search",
                description: "AI searches and finds relevant policy sections for each question.",
              },
              {
                step: "3",
                icon: Bot,
                title: "Draft Answers",
                description: "Claude generates answers with citations to your internal policies.",
              },
              {
                step: "4",
                icon: CheckCircle2,
                title: "Human Review",
                description: "Your team reviews, edits, and approves before exporting.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="relative">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                      {i < 3 && (
                        <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-700 absolute -right-16 hidden md:block" />
                      )}
                    </div>
                    <item.icon className="h-8 w-8 text-slate-400 dark:text-slate-600 mb-4" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 sm:py-32 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Built on Trust & Transparency
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Every answer is grounded in your policies. Every decision is human-approved.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: "Human-in-the-Loop",
                description: "Every AI-generated answer requires explicit human review and approval.",
                features: [
                  "Manual override capability",
                  "Edit & rephrase answers",
                  "Approve before export",
                  "Full audit trail",
                ],
              },
              {
                icon: ShieldCheck,
                title: "Zero Hallucinations",
                description: "Closed-context RAG ensures answers are grounded only in your policies.",
                features: [
                  "Policy-grounded answers",
                  "Confidence scoring",
                  "Source citations",
                  "No fabricated data",
                ],
              },
              {
                icon: BarChart3,
                title: "Smart Analytics",
                description: "Track automation rates, review times, and answer quality metrics.",
                features: [
                  "Real-time dashboards",
                  "Performance metrics",
                  "Team productivity",
                  "Export reports",
                ],
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Perfect for Every Team
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              From startups to enterprises, TrustFlow scales with your needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Security Teams",
                description: "Cut questionnaire response time from weeks to hours.",
                icon: ShieldCheck,
              },
              {
                title: "Legal & Compliance",
                description: "Ensure consistent, policy-aligned responses across all questions.",
                icon: Target,
              },
              {
                title: "Sales Teams",
                description: "Close deals faster by responding to security reviews in days.",
                icon: TrendingUp,
              },
            ].map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center"
                >
                  <Icon className="h-8 w-8 text-blue-600 dark:text-cyan-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">{useCase.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
          >
            <path
              fill="currentColor"
              fillOpacity="0.1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,133.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center space-y-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Ready to Close Deals Faster?
            </h2>
            <p className="text-lg text-white/90">
              Start reviewing security questionnaires with confidence today. No credit card required.
            </p>
            <Button
              size="lg"
              className="bg-white hover:bg-slate-100 text-blue-600 font-semibold h-12 px-8"
              asChild
            >
              <Link to="/projects" className="flex items-center gap-2">
                Launch Review Console <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

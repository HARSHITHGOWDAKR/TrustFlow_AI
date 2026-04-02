import React from 'react';
import { CheckCircle2, Clock, Zap, AlertCircle } from 'lucide-react';

export interface AgentStep {
  id: string;
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  timestamp?: Date;
  details?: string;
}

interface AgentOrchestrationTraceProps {
  steps: AgentStep[];
  isVisible: boolean;
}

const statusIcons = {
  pending: Clock,
  processing: Zap,
  completed: CheckCircle2,
  error: AlertCircle,
};

const statusColors = {
  pending: 'text-slate-400',
  processing: 'text-amber-500 animate-pulse',
  completed: 'text-emerald-500',
  error: 'text-red-500',
};

const statusBgColors = {
  pending: 'bg-slate-500/10',
  processing: 'bg-amber-500/10',
  completed: 'bg-emerald-500/10',
  error: 'bg-red-500/10',
};

export const AgentOrchestrationTrace: React.FC<AgentOrchestrationTraceProps> = ({
  steps,
  isVisible,
}) => {
  if (!isVisible || steps.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 shadow-2xl max-h-96 overflow-y-auto">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Agent Pipeline</h3>
          <span className="text-xs text-slate-400 ml-auto">Real-time Execution</span>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => {
            const IconComponent = statusIcons[step.status];
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id}>
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg ${statusBgColors[step.status]} border border-slate-700/50 transition-all`}
                >
                  <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusColors[step.status]}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white text-sm">{step.agent}</p>
                      {step.timestamp && (
                        <span className="text-xs text-slate-400">
                          {step.timestamp.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{step.message}</p>
                    {step.details && (
                      <p className="text-xs text-slate-400 mt-2 italic">{step.details}</p>
                    )}
                  </div>

                  <span className="text-xs font-medium px-2 py-1 rounded bg-slate-700/50 text-slate-300 flex-shrink-0">
                    {step.status}
                  </span>
                </div>

                {!isLast && (
                  <div className="ml-2.5 w-0.5 h-2 bg-slate-700/30" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

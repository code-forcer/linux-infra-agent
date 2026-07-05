"use client";

import React from "react";
import { Shield, Radio, ServerCog } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
}

export default function Header({ isConnected }: HeaderProps) {
  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#0987d4] flex items-center justify-center shadow-sm">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-base font-bold text-text-primary leading-tight">
                InfraWatch <span className="text-primary">AI</span>
              </h1>
              <p className="text-[0.5625rem] text-text-tertiary uppercase tracking-[0.12em] font-heading font-bold leading-tight">
                Autonomous Infrastructure Agent
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-success animate-pulse-glow"
                    : "bg-error"
                }`}
              />
              <span className="text-xs font-heading font-bold text-text-secondary">
                {isConnected ? "Live" : "Disconnected"}
              </span>
              <Radio
                size={12}
                className={isConnected ? "text-success" : "text-error"}
              />
            </div>

            {/* Server Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
              <ServerCog size={14} />
              <span>prod-infra-node-01</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { Card } from "@/components/ui/card";

interface ContractViewProps {
  contractText: string;
}

export function ContractView({ contractText }: ContractViewProps) {
  return (
    <Card className="bg-surface border-border">
      <pre className="whitespace-pre-wrap font-body text-sm text-text-primary leading-relaxed">
        {contractText}
      </pre>
    </Card>
  );
}

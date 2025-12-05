"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { UiDelegation, NodeScore } from "./types";
import type { ColumnDef, Column } from "@tanstack/react-table";
import { ThemeToggleSimple } from "@/components/theme-toggle";
import { RewardEfficiencyCalculator } from "./RewardEfficiencyCalculator";
import { TokenUpdateDialog } from "./TokenUpdateDialog";

type DelegationWithScore = UiDelegation & {
  latestScore: NodeScore | null;
};

// Calculate Reward Efficiency: combines low margin (better) + high reputation score (better)
// Returns a score from 0-100
function calculateRewardEfficiency(
  marginPct: number,
  reputationScore: number | null
): number | null {
  if (reputationScore === null || reputationScore === undefined) {
    return null;
  }

  // Margin score: lower margin = higher score
  // 0% margin = 100 points, 100% margin = 0 points
  const marginScore = 100 - marginPct;

  // Reputation score: normalize to 0-100 (max observed is ~69)
  const MAX_REPUTATION = 69;
  const reputationNormalized = (reputationScore / MAX_REPUTATION) * 100;

  // Weighted combination: 50% margin, 50% reputation
  const efficiency = marginScore * 0.5 + reputationNormalized * 0.5;

  return Math.round(efficiency);
}

// Get color class based on efficiency score
function getEfficiencyColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600 font-bold";
  if (score >= 60) return "text-yellow-600 font-semibold";
  if (score >= 40) return "text-orange-500 font-semibold";
  return "text-red-500 font-semibold";
}

// Format size in human-readable format
function formatSize(sizeTB: number): string {
  if (sizeTB < 1) {
    return `${(sizeTB * 1024).toFixed(1)} GB`;
  } else if (sizeTB < 10) {
    return `${sizeTB.toFixed(2)} TB`;
  } else if (sizeTB < 100) {
    return `${sizeTB.toFixed(1)} TB`;
  } else {
    return `${sizeTB.toFixed(0)} TB`;
  }
}

// Get background color class based on efficiency score
function getEfficiencyBgColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 80) return "bg-green-100 dark:bg-green-950";
  if (score >= 60) return "bg-yellow-100 dark:bg-yellow-950";
  if (score >= 40) return "bg-orange-100 dark:bg-orange-950";
  return "bg-red-100 dark:bg-red-950";
}

interface DelegationsTableProps {
  delegations: DelegationWithScore[];
}

function SortableHeader<T>({
  column,
  title,
}: {
  column: Column<T>;
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

export function DelegationsTable({ delegations }: DelegationsTableProps) {
  const activeDelegations = delegations.filter((d) => d.status !== "WITHDRAWN");
  const withdrawnDelegations = delegations.filter(
    (d) => d.status === "WITHDRAWN"
  );

  // Create enhanced data with pre-calculated efficiency for sorting
  const activeDelegationsWithEfficiency = useMemo(
    () =>
      activeDelegations.map((d) => ({
        ...d,
        rewardEfficiency: calculateRewardEfficiency(
          d.operatorMarginPct,
          d.latestScore?.reputationScore ?? null
        ),
      })),
    [activeDelegations]
  );

  const activeColumns: ColumnDef<
    DelegationWithScore & { rewardEfficiency: number | null }
  >[] = useMemo(
    () => [
      {
        accessorKey: "nodeName",
        header: "Node",
        cell: ({ row }) => {
          const delegation = row.original;
          return (
            <Button asChild size={"sm"} variant="secondary">
              <Link
                target="_blank"
                href={`https://dashboard.iagon.com/stake/market/nodes/${delegation.nodeId}`}
              >
                {delegation.nodeName}
              </Link>
            </Button>
          );
        },
      },
      {
        accessorKey: "operatorMarginPct",
        header: ({ column }) => (
          <SortableHeader column={column} title="Margin" />
        ),
        cell: ({ row }) => `${row.getValue("operatorMarginPct") as number}%`,
      },
      {
        accessorKey: "sizeTB",
        header: "Size",
        cell: ({ row }) => formatSize(row.getValue("sizeTB") as number),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => row.getValue("status") as string,
      },
      {
        accessorKey: "totalRewards",
        header: "Rewards",
        cell: ({ row }) =>
          (row.getValue("totalRewards") as number).toLocaleString(),
      },
      {
        accessorKey: "latestScore.reputationScore",
        header: ({ column }) => (
          <SortableHeader column={column} title="Latest Score" />
        ),
        cell: ({ row }) => {
          const score = row.original.latestScore?.reputationScore;
          return score !== null && score !== undefined ? (
            <span className="font-semibold">{score}</span>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          );
        },
      },
      {
        accessorKey: "rewardEfficiency",
        header: ({ column }) => (
          <SortableHeader column={column} title="Reward Efficiency" />
        ),
        cell: ({ row }) => {
          const efficiency = row.getValue("rewardEfficiency") as number | null;
          return efficiency !== null ? (
            <div
              className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${getEfficiencyBgColor(
                efficiency
              )}`}
            >
              <span className={getEfficiencyColor(efficiency)}>
                {efficiency}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          );
        },
      },
    ],
    []
  );

  const withdrawnColumns: ColumnDef<DelegationWithScore>[] = useMemo(
    () => [
      {
        accessorKey: "nodeName",
        header: "Node",
        cell: ({ row }) => {
          const delegation = row.original;
          return (
            <Button
              asChild
              size={"sm"}
              variant="outline"
              className="border-muted/50"
            >
              <Link
                target="_blank"
                href={`https://dashboard.iagon.com/stake/market/nodes/${delegation.nodeId}`}
                className="no-underline text-muted-foreground"
              >
                {delegation.nodeName}
              </Link>
            </Button>
          );
        },
      },
      {
        accessorKey: "operatorMarginPct",
        header: "Margin",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("operatorMarginPct") as number}%
          </span>
        ),
      },
      {
        accessorKey: "sizeTB",
        header: "Size",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatSize(row.getValue("sizeTB") as number)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.getValue("status") as string}
          </span>
        ),
      },
      {
        accessorKey: "totalRewards",
        header: "Rewards",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {(row.getValue("totalRewards") as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "latestScore.reputationScore",
        header: "Latest Score",
        cell: ({ row }) => {
          const score = row.original.latestScore?.reputationScore;
          return score !== null && score !== undefined ? (
            <span className="text-muted-foreground">{score}</span>
          ) : (
            <span className="text-muted-foreground/70">N/A</span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-8">
      <div>
        <div className="flex justify-between items-center p-0.5">
          <h1 className="text-2xl font-semibold mb-4">Your Delegations</h1>
          <div className="flex gap-2">
            <TokenUpdateDialog />
            <ThemeToggleSimple />
          </div>
        </div>
        {activeDelegations.length > 0 ? (
          <DataTable
            columns={activeColumns}
            data={activeDelegationsWithEfficiency}
            initialSorting={[{ id: "rewardEfficiency", desc: true }]}
          />
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            No active delegations
          </div>
        )}
      </div>

      {withdrawnDelegations.length > 0 && (
        <div className="opacity-60">
          <h2 className="text-xl font-medium mb-3 text-muted-foreground">
            Withdrawn Delegations
          </h2>
          <div className="border border-muted/30 rounded-lg overflow-hidden">
            <DataTable columns={withdrawnColumns} data={withdrawnDelegations} />
          </div>
        </div>
      )}

      <div className="mt-12">
        <RewardEfficiencyCalculator />
      </div>
    </div>
  );
}

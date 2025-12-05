"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

// Same calculation logic as in DelegationsTable
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

function getEfficiencyBgColor(efficiency: number) {
  if (efficiency >= 80) return "bg-green-100 text-green-800";
  if (efficiency >= 60) return "bg-yellow-100 text-yellow-800";
  if (efficiency >= 40) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getEfficiencyColor(efficiency: number) {
  if (efficiency >= 80) return "text-green-800";
  if (efficiency >= 60) return "text-yellow-800";
  if (efficiency >= 40) return "text-orange-800";
  return "text-red-800";
}

export function RewardEfficiencyCalculator() {
  const [marginPct, setMarginPct] = useState<string>("");
  const [reputationScore, setReputationScore] = useState<string>("");
  const [efficiency, setEfficiency] = useState<number | null>(null);

  const handleCalculate = () => {
    const margin = parseFloat(marginPct);
    const score = reputationScore ? parseFloat(reputationScore) : null;

    if (!isNaN(margin) && margin >= 0 && margin <= 100) {
      const result = calculateRewardEfficiency(margin, score);
      setEfficiency(result);
    }
  };

  const handleReset = () => {
    setMarginPct("");
    setReputationScore("");
    setEfficiency(null);
  };

  const isValid =
    marginPct !== "" &&
    !isNaN(parseFloat(marginPct)) &&
    parseFloat(marginPct) >= 0 &&
    parseFloat(marginPct) <= 100 &&
    (reputationScore === "" ||
      (!isNaN(parseFloat(reputationScore)) &&
        parseFloat(reputationScore) >= 0));

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Reward Efficiency Calculator
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How Reward Efficiency Works</DialogTitle>
                <DialogDescription>
                  Understanding the calculation behind reward efficiency scores
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Calculation Formula:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Lower margin = higher margin score</li>
                    <li>• Higher reputation = higher reputation score</li>
                    <li>
                      • Final score = (margin score + reputation score) ÷ 2
                    </li>
                    <li>• Score range: 0-100 (higher is better)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Score Breakdown:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p> 80-100 = Excellent (Green)</p>
                    <p> 60-79 = Good (Yellow)</p>
                    <p> 40-59 = Fair (Orange)</p>
                    <p> 0-39 = Poor (Red)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Example:</h4>
                  <p className="text-sm text-muted-foreground">
                    5% margin + 65 reputation = 87.5 efficiency score
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-sm">
          Calculate operator efficiency from margin and reputation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="margin" className="text-sm">
                Operator Margin (%)
              </Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g., 5"
                value={marginPct}
                onChange={(e) => setMarginPct(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reputation" className="text-sm">
                Reputation Score (Optional)
              </Label>
              <Input
                id="reputation"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g., 65"
                value={reputationScore}
                onChange={(e) => setReputationScore(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCalculate}
              disabled={!isValid}
              className="flex-1 text-sm"
            >
              Calculate
            </Button>
            <Button onClick={handleReset} variant="outline" className="text-sm">
              Reset
            </Button>
          </div>

          {efficiency !== null && (
            <div className="mt-4 p-3 border rounded-lg text-center">
              <div className="flex justify-center mb-2">
                <div
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${getEfficiencyBgColor(
                    efficiency
                  )}`}
                >
                  <span className={getEfficiencyColor(efficiency)}>
                    {efficiency}/100
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Higher scores indicate better reward efficiency
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

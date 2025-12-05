export type RawDelegation = {
  delegationId: string;
  lastUpdate: string;
  delegationSizeBytes: number;
  iagAmount: string;
  lovelaceValue: string;
  status: "DELEGATED" | "WITHDRAWN" | string;
  salePrice: string;
  discountOrMarkupPercent: number;
  totalFees: string;
  totalRewards: string;
  rod: number;
  actionPermitted: boolean;
  createdAt: string;
  node: {
    nodeId: string;
    name: string;
    operatorMargin: number; // 0.37 = 37%
    gate: boolean;
  };
};

export type UiDelegation = {
  id: string;
  nodeId: string;
  nodeName: string;
  operatorMargin: number; // 0.37
  operatorMarginPct: number; // 37
  status: string;
  sizeBytes: number;
  sizeTB: number;
  iagAmount: number;
  lovelaceValue: number;
  totalRewards: number;
  createdAt: string;
  lastUpdate: string;
};

export type RewardHistoryItem = {
  relative_epoch_index: number;
  epoch_index: number;
  metadata: {
    avg_performance: {
      read_speed: number;
      write_speed: number;
      upload_speed: number;
      download_speed: number;
      reputation_score: number;
    };
  };
  amount: {
    unit: string;
    quantity: string;
  };
  total_amount: {
    unit: string;
    quantity: string;
  };
  view: boolean;
  txSubmitted: boolean;
  valid: boolean;
  release: boolean;
  _id: string;
  year_index: number;
};

export type NodeScore = {
  period: string; // e.g., "Epoch 68" or "2024-04"
  reputationScore: number | null;
  upTime: number | null;
  downTime: number | null;
  startDate?: string;
  endDate?: string;
};

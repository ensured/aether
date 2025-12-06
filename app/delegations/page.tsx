// app/delegations/page.tsx
import { cookies } from "next/headers";
import { DelegationsTable } from "./DelegationsTable";
import { TokenWrapper } from "./TokenWrapper";
import { CacheInfo } from "./CacheInfo";
import type {
  UiDelegation,
  NodeScore,
  RawDelegation,
  RewardHistoryItem,
} from "./types";

const TOKEN_COOKIE_NAME = "iagon_token";

// Validate token by making a test API call
async function validateToken(token: string): Promise<boolean> {
  console.log("validateToken called with token length:", token.length);
  console.log("validateToken token preview:", token.substring(0, 20) + "...");

  // Decode the token first (it might be URI encoded)
  let decodedToken = token;
  try {
    decodedToken = decodeURIComponent(token);
    console.log(
      "Token was URI encoded, decoded preview:",
      decodedToken.substring(0, 20) + "..."
    );
  } catch (error) {
    console.log("Token is not URI encoded, using as-is");
  }

  // Try different authorization formats with the decoded token
  const authFormats = [
    `Bearer ${decodedToken}`,
    decodedToken,
    `Token ${decodedToken}`,
  ];

  for (const authHeader of authFormats) {
    try {
      console.log("Trying auth format:", authHeader.substring(0, 30) + "...");
      const res = await fetch(
        "https://backend.iagon.com/v1/delegation/delegations",
        {
          headers: {
            accept: "*/*",
            authorization: authHeader,
          },
        }
      );
      console.log("Auth format response status:", res.status);
      if (res.ok) {
        console.log(
          "SUCCESS: Auth format worked:",
          authHeader.substring(0, 30) + "..."
        );
        return true;
      }
    } catch (error) {
      console.error("Auth format error:", error);
    }
  }

  console.log("All auth formats failed");
  return false;
}

// Get token - prioritize environment variable, then user token
async function getIagonToken(): Promise<string | null> {
  // First try environment variable
  if (process.env.IAGON_TOKEN) {
    console.log("Using environment variable token");
    return process.env.IAGON_TOKEN;
  }

  // Fall back to user-provided token from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value || null;
  console.log("Cookie token exists:", !!token);
  if (token) {
    console.log("Cookie token length:", token.length);
    console.log("Cookie token preview:", token.substring(0, 20) + "...");
  }
  return token;
}

// Fetch delegations with token
async function fetchDelegationsWithToken(
  token: string
): Promise<{ data: UiDelegation[]; cacheTime: number }> {
  // Decode the token before using it
  let decodedToken = token;
  try {
    decodedToken = decodeURIComponent(token);
  } catch (error) {
    // Token is not encoded, use as-is
  }

  const res = await fetch(
    "https://backend.iagon.com/v1/delegation/delegations",
    {
      next: { revalidate: 21600 }, // Cache for 6 hours
      headers: {
        accept: "*/*",
        authorization: `Bearer ${decodedToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch delegations: ${res.status}`);
  }

  const data = (await res.json()) as RawDelegation[];

  // Check if this response came from cache
  const cacheControl = res.headers.get("cache-control") || "";
  const age = res.headers.get("age") || "0";
  const date = res.headers.get("date") || new Date().toUTCString();

  console.log("Cache headers:", {
    cacheControl,
    age,
    date,
    allHeaders: Object.fromEntries(res.headers.entries()),
  });

  // If there's an age header, it means this came from cache
  const isCached = parseInt(age) > 0;

  // Calculate when this data was actually cached
  const responseTime = new Date(date).getTime();
  const cacheTime = isCached
    ? responseTime - parseInt(age) * 1000
    : responseTime;

  console.log("Cache calculation:", {
    responseTime,
    isCached,
    cacheTime,
    cacheTimeDate: new Date(cacheTime),
  });

  // Fallback: if cacheTime is invalid, use current time
  const finalCacheTime = cacheTime && cacheTime > 0 ? cacheTime : Date.now();
  console.log("Final cache time:", finalCacheTime, new Date(finalCacheTime));

  const delegations = data.map((d) => {
    const sizeTB = d.delegationSizeBytes / 1024 / 1024 / 1024 / 1024;
    const operatorMarginPct = d.node.operatorMargin * 100;

    return {
      id: d.delegationId,
      nodeId: d.node.nodeId,
      nodeName: d.node.name,
      operatorMargin: d.node.operatorMargin,
      operatorMarginPct: Number(operatorMarginPct.toFixed(2)),
      status: d.status,
      sizeBytes: d.delegationSizeBytes,
      sizeTB: Number(sizeTB.toFixed(3)),
      iagAmount: Number(d.iagAmount),
      lovelaceValue: Number(d.lovelaceValue),
      totalRewards: Number(d.totalRewards),
      createdAt: d.createdAt,
      lastUpdate: d.lastUpdate,
    };
  });

  return { data: delegations, cacheTime: finalCacheTime };
}

// Fetch node score with token
async function fetchNodeScoreWithToken(
  nodeId: string,
  token: string
): Promise<NodeScore[]> {
  // Decode the token before using it
  let decodedToken = token;
  try {
    decodedToken = decodeURIComponent(token);
  } catch (error) {
    // Token is not encoded, use as-is
  }

  const res = await fetch(
    `https://rp.iagon.com/api/v1/resource-manager/resource-nodes/${nodeId}/reward-history/public`,
    {
      next: { revalidate: 21600 }, // Cache for 6 hours
      headers: {
        accept: "*/*",
        authorization: `Bearer ${decodedToken}`,
      },
      method: "GET",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch score: ${res.status}`);
  }

  const data = (await res.json()) as RewardHistoryItem[];

  return data.map((item) => ({
    period: `Epoch ${item.epoch_index}`,
    reputationScore: item.metadata.avg_performance.reputation_score ?? null,
    upTime: null,
    downTime: null,
  }));
}

export default async function DelegationsPage() {
  // Get token (env var first, then user token)
  const token = await getIagonToken();

  // If no token is set, show token input
  if (!token) {
    return (
      <main className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Your Delegations</h1>
          <p className="text-muted-foreground">
            Please provide your IAGON API token to view your delegation data
          </p>
        </div>
        <TokenWrapper />
      </main>
    );
  }

  // Validate token before making API calls
  const isTokenValid = await validateToken(token);
  if (!isTokenValid) {
    return (
      <main className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Invalid Token</h1>
          <p className="text-muted-foreground mb-6">
            Your API token is invalid or has expired. Please update your token
            to continue viewing your delegation data.
          </p>
          <TokenWrapper isExpired={true} />
        </div>
      </main>
    );
  }

  try {
    // Fetch all delegations
    const { data: delegations, cacheTime } = await fetchDelegationsWithToken(
      token
    );

    // Fetch all node scores in parallel
    const delegationsWithScores = await Promise.all(
      delegations.map(async (delegation) => {
        try {
          const scores = await fetchNodeScoreWithToken(
            delegation.nodeId,
            token
          );
          const latestScore =
            scores.length > 0 ? scores[scores.length - 1] : null;
          return {
            ...delegation,
            latestScore,
          };
        } catch (error) {
          console.error(
            `Failed to fetch score for ${delegation.nodeId}:`,
            error
          );
          return {
            ...delegation,
            latestScore: null,
          };
        }
      })
    );

    return (
      <main className="max-w-5xl mx-auto py-8 flex flex-col w-full justify-center items-center">
        <CacheInfo cacheTime={cacheTime} revalidateSeconds={21600} />
        <DelegationsTable delegations={delegationsWithScores} />
      </main>
    );
  } catch (error) {
    console.error("Failed to fetch delegations:", error);

    // Check if this is a 401 error (token expired)
    const errorMessage = error instanceof Error ? error.message : "";
    const isTokenExpired = errorMessage.includes("401");

    if (isTokenExpired) {
      return (
        <main className="max-w-4xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Token Expired</h1>
            <p className="text-muted-foreground mb-6">
              Your API token has expired. Please update your token to continue
              viewing your delegation data.
            </p>
            <TokenWrapper isExpired={true} />
          </div>
        </main>
      );
    }

    return (
      <main className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground">
            Failed to fetch delegation data. Please check your token and try
            again.
          </p>
          <div className="mt-4">
            <TokenWrapper isExpired={false} />
          </div>
        </div>
      </main>
    );
  }
}

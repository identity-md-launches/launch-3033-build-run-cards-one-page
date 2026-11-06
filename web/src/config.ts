import { Interface } from "ethers";

export const SITE_NAME = "Run Cards";
export const SITE_DESCRIPTION =
  "Hold $MILES, join Squeektoshi the hamster's run on Sepolia, and get an on-chain card drawn from that run's real numbers.";
export const SITE_ICON = "favicon.svg";

export const CHAIN_ID = 11155111;
export const CHAIN_HEX = "0xaa36a7";
export const CHAIN_NAME = "Sepolia";

/**
 * Public Sepolia RPCs for every read, tried in this order; next one on any error or a 15 s timeout.
 * publicnode and Tenderly answer eth_getLogs over 10,000-block windows; 1rpc only over 50 blocks,
 * so it is last and serves the plain calls when the first two are down.
 */
export const RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.gateway.tenderly.co",
  "https://1rpc.io/sepolia",
];
export const RPC_TIMEOUT_MS = 15_000;
export const LOG_WINDOW = 10_000;

export const RUNCARDS = "0x4ee0160d3e9d9a24e7ab2d933d3cf29c32774b3c";
export const RUNCARDS_DEPLOY_BLOCK = 12075794;
/** $MILES, the 18-decimal coin RunCards locks (its cardio()). */
export const MILES = "0xA5C662B042136D00E5A142112DF4f47bd9ae1B81";
/** The $MILES Wheelpad bonding curve. */
export const CURVE = "0x1Ae975c860D22AEA8d6C6B3398164CfEfd3b7f7E";
export const CURVE_LAUNCH_BLOCK = 12075784;
export const RENDERER = "0xa54b14c031e047c32f63b82301d948647422996d";
export const MILES_SUPPLY = 1_000_000_000;
export const CORE = "0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4";

export const STATUS_URL = "https://api.squeekchain.com/v1/status";
export const POLL_MS = 30_000;
export const BACKOFF_MS = 5 * 60_000;
/** A failed Join simulation is retried this often while the tab is visible. */
export const JOIN_RETRY_MS = 30_000;
/** The $MILES box refreshes this often while visible. */
export const MILES_POLL_MS = 90_000;

export const STAKE = 30_000n * 10n ** 18n;
export const MAX_RUNNERS = 100;

/** Fixed gas limits from the brief, so wallets need not estimate. */
export const GAS = {
  join: 1_500_000n,
  leave: 400_000n,
  sync: 4_000_000n,
  reveal: 400_000n,
  deliver: 40_000_000n,
} as const;

export const EXPLORER = "https://sepolia.etherscan.io";
export const LINKS = {
  runCards: `${EXPLORER}/address/${RUNCARDS}`,
  miles: `${EXPLORER}/token/${MILES}`,
  wheelpad: `https://wheelpad.fun/coin/${CURVE}`,
  squeekchain: "https://squeekchain.com",
};

export const runCardsAbi = new Interface([
  "function join()",
  "function leave(uint256 runNumber)",
  "function deliver(uint256 runNumber) returns (uint256 minted)",
  "function reveal(uint256 runNumber)",
  "function sync() returns (bool caughtUp)",
  "function running() view returns (bool)",
  "function openRun() view returns (uint256)",
  "function runCount() view returns (uint256)",
  "function runInfo(uint256 runNumber) view returns (tuple(uint64 startRound, uint64 lastActiveRound, uint32 activeRounds, uint64 work, uint64 topWork, uint96 unitsBefore, uint96 unitsAfter, bytes32 dataHash, bool closed, bool startedEarly, uint32 minted, uint64 revealAfter, bool revealed, uint64 firstToken, uint64 revealRound, bytes32 revealHash) run, uint256 joiners)",
  "function joined(uint256 runNumber, address who) view returns (bool)",
  "function placeOf(uint256 runNumber, address who) view returns (uint256)",
  "function revealOf(uint256 runNumber) view returns (uint64 round, bytes32 hash)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Joined(uint256 runNumber, address runner)",
  "event Left(uint256 runNumber, address runner)",
  "event Delivered(uint256 runNumber, address runner, uint256 tokenId)",
  "event RunStarted(uint256 runNumber, uint64 startRound)",
  "event RunEnded(uint256 runNumber, uint64 lastActiveRound, uint64 work)",
  "event Revealed(uint256 runNumber, uint64 revealRound)",
  "error NotApproved()",
  "error NotEnoughCardio()",
  "error NotRunning()",
  "error NoOpenRun()",
  "error AlreadyJoined()",
  "error RunFull()",
  "error NotJoined()",
  "error RunNotEnded()",
  "error AlreadyDelivered()",
  "error NothingToDeliver()",
  "error NothingToReveal()",
  "error RevealRoundNotSettled()",
  "error NoSuchRun()",
  "error NotCaughtUp()",
]);

export const erc20Abi = new Interface([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const coreAbi = new Interface([
  "function state() view returns (tuple(uint64 settledThroughRound, uint64 cumulativeWork, uint96 cumulativeBlockUnits, uint64 blockHeight, uint96 blockProgress, uint32 workPerThousandBlocks, uint256 authorizationNonce, bool paused))",
]);

export const curveAbi = new Interface([
  "function priceX18() view returns (uint256)",
  "function rReserve() view returns (uint256)",
  "function rGrad() view returns (uint256)",
  "function graduated() view returns (bool)",
  "event Bought(address indexed buyer, uint256 quoteIn, uint256 coinOut, uint256 fee)",
  "event Sold(address indexed seller, uint256 coinIn, uint256 quoteOut, uint256 fee)",
]);

export const rendererAbi = new Interface([
  "function svg(tuple(uint256 runNumber, uint256 work, uint256 activeRounds, uint256 topWork, uint256 blockFrom, uint256 blockTo, uint256 edition, uint256 editions, bytes32 seed) card) view returns (string)",
]);

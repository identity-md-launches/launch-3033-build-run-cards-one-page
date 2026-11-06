import { Interface } from "ethers";

export const SITE_NAME = "Run Cards";
export const SITE_DESCRIPTION =
  "Join Squeektoshi the hamster's runs on Sepolia: lock 30,000 test $CARDIO while he runs, get an on-chain pixel-hamster card and your coins back.";

export const CHAIN_ID = 11155111;
export const CHAIN_HEX = "0xaa36a7";
export const CHAIN_NAME = "Sepolia";

/** Public Sepolia RPCs, tried in this order; next one on any error or a 15 s timeout. */
export const RPCS = [
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
];
export const RPC_TIMEOUT_MS = 15_000;
export const LOG_WINDOW = 10_000;

export const RUNCARDS = "0x79224b71fec04bbd1c34d0922e04a11da56d56cf";
export const RUNCARDS_DEPLOY_BLOCK = 12074980;
export const CARDIO = "0x1CCcE5C1D320F931B9e409C480F532Ca95C0A26B";
export const CORE = "0xfd6c166d4b8e2962e65746a13e5a0797cd4de0c4";

export const STATUS_URL = "https://api.squeekchain.com/v1/status";
export const POLL_MS = 30_000;
export const BACKOFF_MS = 5 * 60_000;

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
  cardio: `${EXPLORER}/token/${CARDIO}`,
  wheelpad: `https://wheelpad.fun/coin/${CARDIO}`,
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

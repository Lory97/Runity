import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient, useChainId, useSignTypedData } from 'wagmi'
import { privateKeyToAccount } from 'viem/accounts'
import { signTypedData } from 'viem/accounts'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, parseAbi, formatEther } from 'viem'
import { runCoreContractConfig, ERC20_ABI, DEPLOY_BLOCK } from '@/constants/contract'

// We define the strict RunData TypeScript interface representing the Solidity struct
export interface RunData {
  user: `0x${string}`;
  distance: bigint;
  time: bigint;
  date: bigint;
}

// EIP-712 Types for RunCore
export const runDataEIP712Types = {
  RunData: [
    { name: 'user', type: 'address' },
    { name: 'distance', type: 'uint256' },
    { name: 'time', type: 'uint256' },
    { name: 'date', type: 'uint256' }
  ]
} as const;

export function useSignRunData() {
  const chainId = useChainId()
  const { signTypedDataAsync, isPending } = useSignTypedData()

  const signRun = async (runData: RunData) => {
    try {
      const domain = {
        name: 'RunCore',
        version: '1',
        chainId: chainId,
        verifyingContract: runCoreContractConfig.address as `0x${string}`,
      } as const;

      const signature = await signTypedDataAsync({
        domain,
        types: runDataEIP712Types,
        primaryType: 'RunData',
        message: runData,
      })
      return signature
    } catch (err) {
      console.error("EIP-712 Signing failed: ", err)
      throw err
    }
  }

  return { signRun, isSigning: isPending }
}

/**
 * MOCK BACKEND SIGNER (DEMO ONLY)
 * Generates the valid backend signature directly in the frontend using the hardcoded 
 * private key for Account 1 (which matches 0x7099... in your Ignition module).
 * This completely bypasses the need for a Node.js server during your presentation.
 */
export async function generateMockBackendSignature(runData: RunData, chainId: number): Promise<`0x${string}`> {
  const HARDHAT_ACCOUNT_1_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  const account = privateKeyToAccount(HARDHAT_ACCOUNT_1_PK)

  const domain = {
    name: 'RunCore',
    version: '1',
    chainId: chainId,
    verifyingContract: runCoreContractConfig.address as `0x${string}`,
  } as const;

  const signature = await account.signTypedData({
    domain,
    types: runDataEIP712Types,
    primaryType: 'RunData',
    message: runData,
  })

  return signature
}

export function useRunTokenBalance() {
  const { address } = useAccount()

  // 1. Get the integrated RunToken address from RunCore
  const { data: tokenAddress } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'token',
  })

  // 2. Read the balance from the fetched ERC20 address
  const { data: balance, isLoading, refetch, error } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: parseAbi([...ERC20_ABI]),
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 3000,
    }
  })

  return { balance: balance ? (balance as bigint) : BigInt(0), isLoading, refetch }
}

export function useApproveRunToken() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  // 1. Get the integrated RunToken address from RunCore
  const { data: tokenAddress } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'token',
  })

  const approve = async (amount: bigint) => {
    if (!tokenAddress) throw new Error("Token address not found")
    try {
      const tx = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi([...ERC20_ABI]),
        functionName: 'approve',
        args: [runCoreContractConfig.address as `0x${string}`, amount]
      })
      return tx
    } catch (err) {
      console.error("Approve failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return { approve, isLoading: isPending || isWaiting, isSuccess, error, hash }
}

export function useTokenAllowance() {
  const { address } = useAccount()

  // 1. Get the integrated RunToken address from RunCore
  const { data: tokenAddress } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'token',
  })

  // 2. Read allowance for the connected user on the RunCore contract
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: parseAbi([...ERC20_ABI]),
    functionName: 'allowance',
    args: address && runCoreContractConfig.address ?
      [address as `0x${string}`, runCoreContractConfig.address as `0x${string}`] :
      undefined,
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 3000
    }
  })

  return { allowance: allowance ? (allowance as bigint) : BigInt(0), refetch }
}

export function useRunnerProfile() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'runners',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    }
  })

  // Struct: [totalDistance, challengesWon, challengesPlayed, isRegistered]
  const profile = data ? {
    totalDistance: (data as unknown as any[])[0] as bigint,
    challengesWon: (data as unknown as any[])[1] as bigint,
    challengesPlayed: (data as unknown as any[])[2] as bigint,
    isRegistered: (data as unknown as any[])[3] as boolean
  } : null

  return { profile, isLoading, refetch }
}

export function useFetchUserActivity() {
  const { address } = useAccount()
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ['userActivity', address],
    queryFn: async () => {
      if (!publicClient || !address) return []

      const addressArg = address as `0x${string}`;

      // 1. Solo Won
      const soloLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event SoloChallengeWon(address indexed runner, uint256 indexed challengeId, uint256 reward)'),
        args: { runner: addressArg },
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // 2. Multi Joined
      const multiJoinedLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event MultiChallengeJoined(uint256 indexed challengeId, address indexed challenger, uint256 stakeAmount)'),
        args: { challenger: addressArg },
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // 3. Multi Won
      const multiWonLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event MultiChallengeCompleted(uint256 indexed challengeId, address indexed winner, uint256 totalReward)'),
        args: { winner: addressArg },
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // 4. Promo Bought
      const promoLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event PromoCodeBought(address indexed buyer, uint256 promoId, uint256 cost)'),
        args: { buyer: addressArg },
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // 5. Multi Created (also counts as activity for creator)
      const multiCreatedLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event MultiChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 stakeAmount, uint256 distanceTarget, uint256 timeMax, uint256 deadline)'),
        args: { creator: addressArg },
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      const combined = [
        ...soloLogs.map(l => ({ type: 'Solo Won' as const, log: l })),
        ...multiJoinedLogs.map(l => ({ type: 'Multiplayer Joined' as const, log: l })),
        ...multiCreatedLogs.map(l => ({ type: 'Multiplayer Created' as const, log: l })),
        ...multiWonLogs.map(l => ({ type: 'Multiplayer Won' as const, log: l })),
        ...promoLogs.map(l => ({ type: 'Promo Code' as const, log: l })),
      ];

      combined.sort((a, b) => Number((b.log.blockNumber || BigInt(0)) - (a.log.blockNumber || BigInt(0))));

      const latest = combined.slice(0, 5);

      // Map to UI friendly objects
      return latest.map(item => {
        let title = '';
        let hint = '';
        let amount = '';
        let isPositive = true;

        switch (item.type) {
          case 'Solo Won':
            title = 'Solo Run Completed';
            hint = `Challenge #${item.log.args.challengeId}`;
            amount = `+${formatEther(item.log.args.reward || BigInt(0))} RUN`;
            break;
          case 'Multiplayer Created':
            title = 'Initiated Multi';
            hint = `Challenge #${item.log.args.challengeId}`;
            amount = `-${formatEther(item.log.args.stakeAmount || BigInt(0))} RUN`;
            isPositive = false;
            break;
          case 'Multiplayer Joined':
            title = 'Joined Multiplayer';
            hint = `Challenge #${item.log.args.challengeId}`;
            amount = `-${formatEther(item.log.args.stakeAmount || BigInt(0))} RUN`;
            isPositive = false;
            break;
          case 'Multiplayer Won':
            title = 'Won Multiplayer!';
            hint = `Challenge #${item.log.args.challengeId}`;
            amount = `+${formatEther(item.log.args.totalReward || BigInt(0))} RUN`;
            break;
          case 'Promo Code':
            title = 'Bought Promo Code';
            hint = `Promo #${item.log.args.promoId}`;
            amount = `-${formatEther(item.log.args.cost || BigInt(0))} RUN`;
            isPositive = false;
            break;
        }

        return {
          id: `${item.log.blockHash}-${item.log.logIndex}`,
          title,
          hint,
          amount,
          isPositive
        }
      })
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 30000,
  })
}

export function useRegisterRunner() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const registerRunner = async () => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'registerRunner',
      })
      return tx
    } catch (err) {
      console.error("Register failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return { registerRunner, isLoading: isPending || isWaiting, isSuccess, error }
}

export function useSubmitSoloRun() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const submitSoloRun = async (challengeId: bigint, runData: RunData, signature: `0x${string}`) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'claimSoloChallenge',
        args: [challengeId, runData, signature]
      })
      return tx
    } catch (err) {
      console.error("Submission failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    submitSoloRun,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useStakeMultiplayer() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const stakeMultiplayer = async (challengeId: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'joinMultiChallenge',
        args: [challengeId]
      })
      return tx
    } catch (err) {
      console.error("Stake failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    stakeMultiplayer,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useSubmitMultiplayerResult() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  // The ABI specifies submitting the result to win the multiplayer pool
  const submitMultiplayerResult = async (challengeId: bigint, runData: RunData, signature: `0x${string}`) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'submitMultiplayerResult',
        args: [challengeId, runData, signature]
      })
      return tx
    } catch (err) {
      console.error("Submission failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    submitMultiplayerResult,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useResolveMultiChallenge() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const resolveMultiChallenge = async (challengeId: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'resolveMultiChallenge',
        args: [challengeId]
      })
      return tx
    } catch (err) {
      console.error("Resolution failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    resolveMultiChallenge,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useClaimRefund() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const claimRefund = async (challengeId: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'claimRefund',
        args: [challengeId]
      })
      return tx
    } catch (err) {
      console.error("Refund failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    claimRefund,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useHasSubmitted(challengeId?: bigint) {
  const { address } = useAccount()
  const { data, refetch } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'hasSubmitted',
    args: challengeId !== undefined && address ? [challengeId, address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && challengeId !== undefined,
      refetchInterval: 3000
    }
  })

  return { hasSubmitted: !!data, refetch }
}

export function useCreateMultiChallenge() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const createMultiChallenge = async (distanceTarget: bigint, timeMax: bigint, stakeAmount: bigint, duration: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'createMultiChallenge',
        args: [distanceTarget, timeMax, stakeAmount, duration]
      })
      return tx
    } catch (err) {
      console.error("Create Multiplayer failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    createMultiChallenge,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useRedeemPromoCode() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const redeemPromoCode = async (promoId: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'buyPromoCode',
        args: [promoId]
      })
      return tx
    } catch (err) {
      console.error("Redemption failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    redeemPromoCode,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

export function useAddPromoCode() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const addPromoCode = async (promoId: bigint, cost: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'setPromoCost',
        args: [promoId, cost]
      })
      return tx
    } catch (err) {
      console.error("Add Promo failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    addPromoCode,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

// Fetch all active Promos added by the Admin
export function useFetchPromoCodes() {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ['promoCodesActive'],
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not available")

      const logs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event PromoAdded(uint256 indexed promoId, uint256 cost)'),
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // We only care about the latest cost assigned to a promoId (in case the admin changes it)
      const promosMap: Record<string, bigint> = {}

      for (const log of logs) {
        if (log.args.promoId === undefined || log.args.cost === undefined) continue;
        promosMap[log.args.promoId.toString()] = log.args.cost;
      }

      return promosMap; // returns object where key is promoId and value is cost (in wei)
    },
    enabled: !!publicClient
  })
}

// =======================
// ADMIN & EVENT LOGIC
// =======================

export function useHasJoined(challengeId: bigint | undefined) {
  const { address } = useAccount()
  const { data: hasJoined, refetch, isLoading } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'hasJoined',
    args: challengeId !== undefined && address ? [challengeId, address] : undefined,
    query: {
      enabled: !!address && challengeId !== undefined
    }
  })

  return { isJoined: !!hasJoined, refetch, isLoading }
}

export function useIsOwner() {
  const { address } = useAccount()
  const { data: ownerAddress, isLoading, error } = useReadContract({
    address: runCoreContractConfig.address as `0x${string}`,
    abi: runCoreContractConfig.abi,
    functionName: 'owner',
  })

  return {
    isOwner: address && ownerAddress && address.toLowerCase() === (ownerAddress as string).toLowerCase(),
    isLoading,
    error
  }
}

export function useAddSoloChallenge() {
  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const addSoloChallenge = async (distanceTarget: bigint, timeMax: bigint, reward: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: runCoreContractConfig.address as `0x${string}`,
        abi: runCoreContractConfig.abi,
        functionName: 'addSoloChallenge',
        args: [distanceTarget, timeMax, reward]
      })
      return tx
    } catch (err) {
      console.error("Add Solo Challenge failed: ", err)
      throw err
    }
  }

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    addSoloChallenge,
    hash,
    error,
    isLoading: isPending || isWaiting,
    isSuccess
  }
}

// Fetch past SoloChallengeAdded events to list them without iterating IDs sequentially
export function useFetchSoloChallengeEvents() {
  const publicClient = usePublicClient()
  const { address } = useAccount()

  return useQuery({
    queryKey: ['soloChallengesEvents', address],
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not available")
      // event SoloChallengeAdded(uint256 indexed challengeId, uint256 distance, uint256 timeMax, uint256 reward)
      const addedLogs = await publicClient.getLogs({
        address: runCoreContractConfig.address as `0x${string}`,
        event: parseAbiItem('event SoloChallengeAdded(uint256 indexed challengeId, uint256 distance, uint256 timeMax, uint256 reward)'),
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      let wonChallengeIds: string[] = [];
      if (address) {
        const wonLogs = await publicClient.getLogs({
          address: runCoreContractConfig.address as `0x${string}`,
          event: parseAbiItem('event SoloChallengeWon(address indexed runner, uint256 indexed challengeId, uint256 reward)'),
          args: { runner: address as `0x${string}` },
          fromBlock: DEPLOY_BLOCK,
          toBlock: 'latest'
        })
        wonChallengeIds = wonLogs.map(log => log.args.challengeId ? log.args.challengeId.toString() : '')
      }

      const mapped = addedLogs.map((log) => {
        const isWon = wonChallengeIds.includes(log.args.challengeId ? log.args.challengeId.toString() : '');
        return {
          challengeId: log.args.challengeId,
          distance: log.args.distance,
          timeMax: log.args.timeMax,
          reward: log.args.reward,
          isCompleted: isWon
        };
      })

      // Sort: Incomplete first, then by Challenge ID descending (newest first)
      mapped.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) {
          return Number((b.challengeId || BigInt(0)) - (a.challengeId || BigInt(0)));
        }
        return a.isCompleted ? 1 : -1;
      })

      return mapped;
    },
    enabled: !!publicClient,
    refetchInterval: 30000
  })
}

// Fetch all Multiplayer events and reduce them into Live State memory Maps
export function useFetchMultiPlayerState() {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ['multiplayerChallengesStats'],
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not available")

      const contractAddr = runCoreContractConfig.address as `0x${string}`;

      const createdLogs = await publicClient.getLogs({
        address: contractAddr,
        event: parseAbiItem('event MultiChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 stakeAmount, uint256 distanceTarget, uint256 timeMax, uint256 deadline)'),
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })


      const joinedLogs = await publicClient.getLogs({
        address: contractAddr,
        event: parseAbiItem('event MultiChallengeJoined(uint256 indexed challengeId, address indexed challenger, uint256 stakeAmount)'),
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      const completedLogs = await publicClient.getLogs({
        address: contractAddr,
        event: parseAbiItem('event MultiChallengeCompleted(uint256 indexed challengeId, address indexed winner, uint256 totalReward)'),
        fromBlock: DEPLOY_BLOCK,
        toBlock: 'latest'
      })

      // Combine logs into a list of challenges
      const challenges: any[] = []

      const challengeIds = createdLogs.map(log => log.args.challengeId).filter(id => id !== undefined) as bigint[];

      let results: any[] = [];
      if (challengeIds.length > 0) {
        const contracts = challengeIds.map(id => ({
          address: contractAddr,
          abi: runCoreContractConfig.abi,
          functionName: 'multiChallenges' as const,
          args: [id] as const
        }));
        try {
          results = await publicClient.multicall({ contracts });
        } catch (err) {
          console.error("Multicall failed:", err);
          // Fallback if multicall isn't supported on RPC
          results = await Promise.all(contracts.map(c => 
            publicClient.readContract(c).then(res => ({ result: res, status: 'success' })).catch(error => ({ error, status: 'failure' }))
          ));
        }
      }

      challengeIds.forEach((id, index) => {
        const result = results[index];
        if (result?.status === 'failure') {
          console.error(`Error fetching challenge ${id}:`, result.error);
          return;
        }

        const data = result?.result as any;
        if (!data) return;

        // Find challengers for this ID from logs
        const challengers = joinedLogs
          .filter(j => j.args.challengeId !== undefined && BigInt(j.args.challengeId) === BigInt(id))
          .map(j => j.args.challenger)

        // Resilience: handle both array and object returns from viem
        const isArray = Array.isArray(data);

        challenges.push({
          challengeId: id,
          creator: isArray ? data[0] : data.creator,
          stakeAmount: isArray ? data[1] : data.stakeAmount,
          distanceTarget: isArray ? data[2] : data.distanceTarget,
          timeMax: isArray ? data[3] : data.timeMax,
          deadline: isArray ? data[4] : data.deadline,
          challengerCount: isArray ? data[5] : data.challengerCount,
          bestTime: isArray ? data[6] : data.bestTime,
          isCompleted: isArray ? data[7] : data.isCompleted,
          winner: isArray ? data[8] : data.winner,
          challengers
        })
      });

      // Sort: Open challenges first, then by ID descending
      challenges.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) {
          return Number(b.challengeId - a.challengeId)
        }
        return a.isCompleted ? 1 : -1
      })

      return challenges
    },
    enabled: !!publicClient,
    refetchInterval: 30000
  })
}

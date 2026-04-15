/**
 * Runity Error Parser
 * Translates raw Web3/Viem error messages into user-friendly messages.
 * This prevents showing incomprehensible hex data and Solidity internals to end users.
 */

// Mapping of Solidity revert strings to user-friendly messages
const REVERT_MESSAGES: Record<string, string> = {
  // Registration
  'Already registered': 'You have already registered your runner profile.',

  // Solo Challenges
  'Not registered': 'You need to register your Runner Profile first (Dashboard).',
  'Challenge not active': 'This challenge is no longer active.',
  'Run already submitted': 'This run has already been submitted.',
  'Invalid backend signature': 'The run data could not be verified. Please try again.',
  'Time limit exceeded': 'Your run time exceeds the maximum allowed for this challenge.',

  // Multiplayer
  'Stake must be > 0': 'The stake amount must be greater than zero.',
  'Duration must be > 0': 'The challenge duration must be greater than zero.',
  'Distance target must be > 0': 'The distance target must be greater than zero.',
  'Time max must be > 0': 'The time limit must be greater than zero.',
  'Challenge already completed': 'This challenge has already been resolved.',
  'Challenge expired': 'This challenge has expired.',
  'Already joined': 'You have already joined this challenge.',
  'Not a participant': 'You are not a participant in this challenge.',
  'Challenge already resolved': 'This challenge has already been resolved.',
  'Challenge completed, no refund': 'This challenge is completed — refunds are not available.',
  'RunData user mismatch': 'Your wallet address does not match the run data.',

  // Marketplace / Promo
  'Promo not available': 'This reward is not currently available.',

  // Token
  'ERC20InsufficientBalance': 'Insufficient RUN token balance for this action.',
  'ERC20InsufficientAllowance': 'You need to approve more RUN tokens before this action.',

  // OpenZeppelin Ownable
  'OwnableUnauthorizedAccount': 'Only the contract admin can perform this action.',
}

// Generic error patterns detected from viem error message strings
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /user rejected|user denied|rejected the request|ACTION_REJECTED/i,
    message: 'Transaction cancelled — you declined the request in your wallet.',
  },
  {
    pattern: /insufficient funds|cannot estimate gas|gas required exceeds/i,
    message: 'Insufficient funds in your wallet to cover gas fees.',
  },
  {
    pattern: /nonce too low|nonce.*already been used/i,
    message: 'Transaction conflict — please reset your wallet nonce or wait a moment and retry.',
  },
  {
    pattern: /network|disconnected|could not detect network|chain mismatch/i,
    message: 'Network error — please check your connection and make sure you are on the correct chain.',
  },
  {
    pattern: /timeout|request timed out/i,
    message: 'The network is taking too long to respond. Please try again.',
  },
  {
    pattern: /execution reverted$/i,
    message: 'Transaction rejected by the smart contract. Please verify your inputs and try again.',
  },
]

/**
 * Parses a raw Web3 error into a clean, user-friendly message.
 */
export function parseContractError(error: unknown): string {
  if (!error) return 'An unknown error occurred.'

  const err = error as any

  // 1. Check viem's shortMessage first (most useful quick message)
  const shortMessage: string = err?.shortMessage || ''

  // 2. Try to extract Solidity revert reason from the error chain
  //    Viem wraps contract errors in a nested structure
  const revertReason = extractRevertReason(err)
  if (revertReason && REVERT_MESSAGES[revertReason]) {
    return REVERT_MESSAGES[revertReason]
  }

  // 3. Check if shortMessage contains a known revert string
  for (const [key, message] of Object.entries(REVERT_MESSAGES)) {
    if (shortMessage.includes(key) || err?.message?.includes(key)) {
      return message
    }
  }

  // 4. Check for well-known error name patterns (e.g. ERC20InsufficientBalance)
  const errorName = err?.cause?.data?.errorName || err?.data?.errorName || ''
  if (errorName && REVERT_MESSAGES[errorName]) {
    return REVERT_MESSAGES[errorName]
  }

  // 5. Check against regex patterns for common wallet/network errors
  const fullMessage = `${shortMessage} ${err?.message || ''}`
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(fullMessage)) {
      return message
    }
  }

  // 6. If viem gave us a short message, clean it up and return it
  if (shortMessage) {
    // Remove technical prefixes viem adds
    const cleaned = shortMessage
      .replace(/^ContractFunctionRevertedError:\s*/i, '')
      .replace(/^The contract function .* reverted with the following reason:\s*/i, '')
      .replace(/^execution reverted:\s*/i, '')
      .trim()
    
    if (cleaned.length > 0 && cleaned.length < 200) {
      return cleaned
    }
  }

  // 7. Absolute fallback
  return 'Something went wrong. Please try again or check your wallet.'
}

/**
 * Attempts to extract the revert reason string from nested viem error objects.
 */
function extractRevertReason(err: any): string | null {
  // viem nests the revert reason in err.cause.reason or err.cause.data
  if (err?.cause?.reason) return err.cause.reason
  if (err?.cause?.data?.message) return err.cause.data.message
  if (err?.cause?.shortMessage) {
    const match = err.cause.shortMessage.match(/reverted with.*?:\s*(.+)/i)
    if (match) return match[1].trim()
  }
  // Sometimes it's directly on the error
  if (err?.reason) return err.reason

  // Try the message itself for revert strings
  const msg = err?.message || ''
  const revertMatch = msg.match(/reverted with reason string '([^']+)'/i)
    || msg.match(/execution reverted:\s*"?([^"]+)"?/i)
    || msg.match(/reason:\s*(.+)/i)
  if (revertMatch) return revertMatch[1].trim()

  return null
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./RunToken.sol";

/**
 * @title RunCore
 * @dev Main logic contract for the Runity Dapp (Move-to-Earn).
 * Handles the registration of runners, solo challenges, multiplayer staking challenges,
 * and promo code purchasing. Includes an off-chain EIP-712 signature verification.
 */
contract RunCore is Ownable, EIP712 {
    using ECDSA for bytes32;

    /**
     * @dev EIP-712 TypeHash for RunData structure.
     * Includes the user address to prevent mempool frontrunning.
     */
    bytes32 private constant RUNDATA_TYPEHASH =
        keccak256(
            "RunData(address user,uint256 distance,uint256 time,uint256 date,uint256 steps,uint256 avgSpeed,uint256 maxSpeed)"
        );

    /**
     * @dev Structure representing a runner profile.
     */
    struct Runner {
        uint256 totalDistance;
        uint256 challengesWon;
        uint256 challengesPlayed;
        bool isRegistered;
    }

    /**
     * @dev Structure for system-wide solo challenges.
     */
    struct SoloChallenge {
        uint256 distanceTarget;
        uint256 timeMax;
        uint256 reward;
        bool isActive;
    }

    /**
     * @dev Structure for User vs User multiplayer challenges.
     */
    struct MultiChallenge {
        address creator;
        uint256 stakeAmount;
        uint256 distanceTarget;
        uint256 timeMax;
        uint256 deadline;
        uint256 challengerCount;
        uint256 bestTime; // Shortest time recorded
        bool isCompleted;
        address winner;
    }

    /**
     * @dev Structure for wrapping course data provided by the user.
     */
    struct RunData {
        address user;
        uint256 distance;
        uint256 time;
        uint256 date;
        uint256 steps;
        uint256 avgSpeed;
        uint256 maxSpeed;
    }

    /// @notice Tracks the data profile of every runner.
    mapping(address => Runner) public runners;

    /// @notice Maps a solo challenge ID to its associated structure.
    mapping(uint256 => SoloChallenge) public soloChallenges;

    /// @notice Maps a multiplayer challenge ID to its associated structure.
    mapping(uint256 => MultiChallenge) public multiChallenges;

    /// @notice Maps a challenge ID to a mapping of participants (O(1) lookup & anti double-join).
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;

    /// @notice Maps a hash of run data to a boolean to prevent replay attacks.
    mapping(bytes32 => bool) public executedRuns;

    /// @notice Tracks the respective cost in RUN tokens for a promo code ID.
    mapping(uint256 => uint256) public promoCosts;

    /// @notice ID counter for creating subsequent solo challenges.
    uint256 public nextSoloChallengeId;

    /// @notice ID counter for creating subsequent multi challenges.
    uint256 public nextMultiChallengeId;

    /// @notice Maximum number of challengers allowed per multiplayer challenge.
    uint256 public constant MAX_CHALLENGERS = 50;

    /// @notice Address of the recognized backend server that signs legitimate runs.
    address public backendSigner;

    /// @notice Reference to the Runity ERC20 soulbound Token.
    RunToken public token;

    /// @notice Emitted when a new runner registers.
    event RunnerRegistered(address indexed runner);

    /// @notice Emitted when the admin creates a new Solo Challenge.
    event SoloChallengeAdded(
        uint256 indexed challengeId,
        uint256 distance,
        uint256 timeMax,
        uint256 reward
    );

    /// @notice Emitted when a user successfully completes a Solo Challenge.
    event SoloChallengeWon(address indexed runner, uint256 indexed challengeId);

    /// @notice Emitted when a user creates a Multiplayer challenge and stakes their tokens.
    event MultiChallengeCreated(
        uint256 indexed challengeId,
        address indexed creator,
        uint256 stakeAmount,
        uint256 distanceTarget,
        uint256 timeMax,
        uint256 deadline
    );

    /// @notice Emitted when a user joins an existing Multiplayer challenge and stakes tokens.
    event MultiChallengeJoined(
        uint256 indexed challengeId,
        address indexed challenger
    );

    /// @notice Emitted when a user claims victory in a multiplayer challenge.
    event MultiChallengeCompleted(
        uint256 indexed challengeId,
        address indexed winner,
        uint256 totalReward
    );

    /// @notice Emitted when a participant is refunded due to challenge expiry without any winners.
    event MultiChallengeRefunded(
        uint256 indexed challengeId,
        address indexed participant
    );

    /// @notice Emitted when a user submits a result for a multiplayer challenge.
    event MultiChallengeResultSubmitted(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 time
    );

    /// @notice Emitted when a new promo item is listed by the admin.
    event PromoAdded(uint256 indexed promoId, uint256 cost);

    /// @notice Emitted when a user burns tokens to buy a promo code.
    event PromoCodeBought(address indexed buyer, uint256 promoId, uint256 cost);

    /**
     * @dev Initializes the contract by linking the token and setting the backend signer.
     */
    constructor(
        address _tokenAddress,
        address _signer
    ) Ownable(msg.sender) EIP712("RunCore", "1") {
        token = RunToken(_tokenAddress);
        backendSigner = _signer;
    }

    /**
     * @notice Updates the oracle backend signer address.
     */
    function setBackendSigner(address _signer) external onlyOwner {
        backendSigner = _signer;
    }

    /**
     * @notice Registers the caller as a Runner, allowing participation.
     */
    function registerRunner() external {
        require(!runners[msg.sender].isRegistered, "Already registered");
        runners[msg.sender].isRegistered = true;
        emit RunnerRegistered(msg.sender);
    }

    // --- Safety Internal Payouts (Anti-DoS) ---

    function _payoutMint(address to, uint256 amount) internal {
        uint256 maxBalance = token.MAX_BALANCE();
        uint256 currentBalance = token.balanceOf(to);
        uint256 amountToGive = amount;

        if (currentBalance + amount > maxBalance) {
            amountToGive = maxBalance - currentBalance;
        }

        if (amountToGive > 0) {
            token.mint(to, amountToGive);
        }
    }

    function _payoutEscrow(address to, uint256 amount) internal {
        uint256 maxBalance = token.MAX_BALANCE();
        uint256 currentBalance = token.balanceOf(to);
        uint256 amountToGive = amount;
        uint256 amountToBurn = 0;

        if (currentBalance + amount > maxBalance) {
            amountToGive = maxBalance - currentBalance;
            amountToBurn = amount - amountToGive;
        }

        if (amountToGive > 0) {
            token.transfer(to, amountToGive);
        }
        // Burn escrowed tokens that couldn't be sent to avoid sticking in contract
        if (amountToBurn > 0) {
            token.burn(address(this), amountToBurn);
        }
    }

    // --- Signature Verification ---

    /**
     * @dev Verifies that the run data matches the backend's EIP-712 signature.
     */
    function _verifyRunSignature(
        RunData calldata data,
        bytes calldata signature
    ) internal returns (bytes32) {
        // Enforce the data user is the tx sender to prevent frontrunning
        require(data.user == msg.sender, "RunData user mismatch");

        bytes32 structHash = keccak256(
            abi.encode(
                RUNDATA_TYPEHASH,
                data.user,
                data.distance,
                data.time,
                data.date,
                data.steps,
                data.avgSpeed,
                data.maxSpeed
            )
        );

        bytes32 runHash = _hashTypedDataV4(structHash);

        require(!executedRuns[runHash], "Run already submitted");
        executedRuns[runHash] = true;

        address recoveredSigner = ECDSA.recover(runHash, signature);
        require(recoveredSigner == backendSigner, "Invalid backend signature");

        return runHash;
    }

    // --- Solo Mode ---

    function addSoloChallenge(
        uint256 _distanceTarget,
        uint256 _timeMax,
        uint256 _reward
    ) external onlyOwner {
        soloChallenges[nextSoloChallengeId] = SoloChallenge({
            distanceTarget: _distanceTarget,
            timeMax: _timeMax,
            reward: _reward,
            isActive: true
        });
        emit SoloChallengeAdded(
            nextSoloChallengeId,
            _distanceTarget,
            _timeMax,
            _reward
        );
        nextSoloChallengeId++;
    }

    function claimSoloChallenge(
        uint256 challengeId,
        RunData calldata data,
        bytes calldata signature
    ) external {
        require(runners[msg.sender].isRegistered, "Not registered");
        SoloChallenge memory challenge = soloChallenges[challengeId];
        require(challenge.isActive, "Challenge not active");
        require(
            data.distance >= challenge.distanceTarget,
            "Distance target not met"
        );
        require(data.time <= challenge.timeMax, "Time limit exceeded");

        _verifyRunSignature(data, signature);

        runners[msg.sender].totalDistance += data.distance;

        _payoutMint(msg.sender, challenge.reward);

        emit SoloChallengeWon(msg.sender, challengeId);
    }

    // --- Multiplayer Mode ---

    function createMultiChallenge(
        uint256 _distanceTarget,
        uint256 _timeMax,
        uint256 _stakeAmount,
        uint256 _duration
    ) external {
        require(runners[msg.sender].isRegistered, "Not registered");
        require(_stakeAmount > 0, "Stake must be > 0");

        // Escrow the stake
        token.transferFrom(msg.sender, address(this), _stakeAmount);

        uint256 challengeId = nextMultiChallengeId++;
        MultiChallenge storage newChallenge = multiChallenges[challengeId];
        newChallenge.creator = msg.sender;
        newChallenge.distanceTarget = _distanceTarget;
        newChallenge.timeMax = _timeMax;
        newChallenge.stakeAmount = _stakeAmount;
        newChallenge.deadline = block.timestamp + _duration;
        newChallenge.challengerCount = 1;
        newChallenge.bestTime = type(uint256).max;
        newChallenge.isCompleted = false;

        hasJoined[challengeId][msg.sender] = true;
        runners[msg.sender].challengesPlayed++;

        emit MultiChallengeCreated(
            challengeId,
            msg.sender,
            _stakeAmount,
            _distanceTarget,
            _timeMax,
            newChallenge.deadline
        );
    }

    function joinMultiChallenge(uint256 challengeId) external {
        require(runners[msg.sender].isRegistered, "Not registered");
        MultiChallenge storage challenge = multiChallenges[challengeId];
        require(!challenge.isCompleted, "Challenge already completed");
        require(
            block.timestamp < challenge.deadline,
            "Challenge deadline passed"
        );
        require(
            challenge.challengerCount < MAX_CHALLENGERS,
            "Challenge is full"
        );
        require(!hasJoined[challengeId][msg.sender], "Already joined");

        hasJoined[challengeId][msg.sender] = true;
        challenge.challengerCount++;
        runners[msg.sender].challengesPlayed++;

        // Escrow the stake
        token.transferFrom(msg.sender, address(this), challenge.stakeAmount);

        emit MultiChallengeJoined(challengeId, msg.sender);
    }

    function submitMultiplayerResult(
        uint256 challengeId,
        RunData calldata data,
        bytes calldata signature
    ) external {
        MultiChallenge storage challenge = multiChallenges[challengeId];
        require(!challenge.isCompleted, "Challenge already resolved");
        require(
            block.timestamp <= challenge.deadline,
            "Challenge deadline passed"
        );
        require(hasJoined[challengeId][msg.sender], "Not a participant");
        require(
            !hasSubmitted[challengeId][msg.sender],
            "Already submitted your result"
        );
        require(
            data.distance >= challenge.distanceTarget,
            "Distance target not met"
        );
        require(data.time <= challenge.timeMax, "Time limit exceeded");

        _verifyRunSignature(data, signature);

        hasSubmitted[challengeId][msg.sender] = true;

        // Update best performance
        if (data.time < challenge.bestTime) {
            challenge.bestTime = data.time;
            challenge.winner = msg.sender;
        }

        runners[msg.sender].totalDistance += data.distance;

        emit MultiChallengeResultSubmitted(challengeId, msg.sender, data.time);
    }

    /**
     * @dev Resolves a multiplayer challenge and distributes the pool to the winner.
     */
    function resolveMultiChallenge(uint256 challengeId) external {
        MultiChallenge storage challenge = multiChallenges[challengeId];
        require(!challenge.isCompleted, "Challenge already resolved");
        require(
            block.timestamp > challenge.deadline,
            "Challenge deadline not yet passed"
        );
        require(
            msg.sender == owner() || hasJoined[challengeId][msg.sender],
            "Only admin or participant can resolve"
        );

        challenge.isCompleted = true;

        if (challenge.winner != address(0)) {
            runners[challenge.winner].challengesWon++;
            uint256 totalPool = challenge.stakeAmount *
                challenge.challengerCount;
            _payoutEscrow(challenge.winner, totalPool);
            emit MultiChallengeCompleted(
                challengeId,
                challenge.winner,
                totalPool
            );
        }
    }

    function claimRefund(uint256 challengeId) external {
        MultiChallenge storage challenge = multiChallenges[challengeId];
        require(!challenge.isCompleted, "Challenge completed, no refund");
        require(
            block.timestamp > challenge.deadline,
            "Deadline not passed yet"
        );
        require(
            hasJoined[challengeId][msg.sender],
            "Not a participant or already refunded"
        );

        // Release user from mapping to prevent double pull refund
        hasJoined[challengeId][msg.sender] = false;

        // Refund the stake using Escrow payout logic
        _payoutEscrow(msg.sender, challenge.stakeAmount);

        emit MultiChallengeRefunded(challengeId, msg.sender);
    }

    // --- Store / Promos ---

    function setPromoCost(uint256 promoId, uint256 cost) external onlyOwner {
        promoCosts[promoId] = cost;
        emit PromoAdded(promoId, cost);
    }

    function buyPromoCode(uint256 promoId) external {
        uint256 cost = promoCosts[promoId];
        require(cost > 0, "Promo not available");
        // Burn user tokens to buy promo
        token.burn(msg.sender, cost);
        emit PromoCodeBought(msg.sender, promoId, cost);
    }
}

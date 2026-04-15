import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();


describe("RunCore", function () {
  let token: any;
  let core: any;
  let owner: any;
  let backendSigner: any;
  let user: any;
  let challenger: any;
  let domain: any;

  const types = {
    RunData: [
      { name: "user", type: "address" },
      { name: "distance", type: "uint256" },
      { name: "time", type: "uint256" },
      { name: "date", type: "uint256" }
    ]
  };

  async function setUpRundataAndSignature(runner?: any, distance?: number, time?: number, date?: number) {
    const runData = {
      user: runner?.address || user.address,
      distance: distance || 5100,
      time: time || 3500,
      date: date || Math.floor(Date.now() / 1000)
    };
    const signature = await backendSigner.signTypedData(domain, types, runData);
    return { runData, signature };
  }

  beforeEach(async function () {
    [owner, backendSigner, user, challenger] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("RunToken");
    token = await Token.deploy();

    const Core = await ethers.getContractFactory("RunCore");
    core = await Core.deploy(token.target, backendSigner.address);

    await token.setCoreContract(core.target);

    // EIP-712 Domain Separator
    domain = {
      name: "RunCore",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: core.target
    };
  });

  describe("addSoloChallenge(uint256 _distanceTarget, uint256 _timeMax, uint256 _reward)", function () {
    it("Should only allow the owner to add a solo challenge", async function () {
      await expect(core.connect(user).addSoloChallenge(5000, 3600, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(core, "OwnableUnauthorizedAccount").withArgs(user.address);
    });
    it("Should properly add a solo challenge", async function () {
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      expect(await core.soloChallenges(0)).to.deep.equal([
        5000,
        3600,
        ethers.parseEther("10"),
        true
      ]);
    });
    it("Should emit the SoloChallengeAdded event", async function () {
      await expect(core.addSoloChallenge(5000, 3600, ethers.parseEther("10")))
        .to.emit(core, "SoloChallengeAdded")
        .withArgs(0, 5000, 3600, ethers.parseEther("10"));
    });
  })

  describe("claimSoloChallenge(uint256 _challengeId, RunData calldata _runData, bytes calldata _signature)", function () {
    it("Should only allow a registered runner to claim a solo challenge", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.be.revertedWith("Not registered");
    });
    it("Should only allow user to claim active solo challenge", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.setSoloChallengeActive(0, false);
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.be.revertedWith("Challenge not active");
    });
    it("Should only allow user to claim if the run data respects the time challenge requirements", async function () {
      const { runData, signature } = await setUpRundataAndSignature(user, 5000, 4600, Math.floor(Date.now() / 1000));
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.be.revertedWith("Time limit exceeded");
    });
    it("Should only allow user to claim if the run data respects the distance challenge requirements", async function () {
      const { runData, signature } = await setUpRundataAndSignature(user, 4000, 3600, Math.floor(Date.now() / 1000));
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.be.revertedWith("Distance target not met");
    });
    it("Should emit SoloChallengeWon event", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.emit(core, "SoloChallengeWon")
        .withArgs(user.address, 0, ethers.parseEther("10"));
    });
    it("Should reward the user with the reward amount", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.emit(core, "SoloChallengeWon")
        .withArgs(user.address, 0, ethers.parseEther("10"));
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
    });
    it("Should not allow user to claim the same solo challenge twice", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
        .to.be.revertedWith("Run already submitted");
    });
    it("Should safely cap rewards at MAX_BALANCE", async function () {
      await core.connect(user).registerRunner();

      // Give user 9995 RUN manually through core via a massive solo challenge
      await core.addSoloChallenge(1, 9999, ethers.parseEther("4995"));
      const runData1 = { user: user.address, distance: 10, time: 10, date: 1 };
      let signature = await backendSigner.signTypedData(domain, types, runData1);
      await core.connect(user).claimSoloChallenge(0, runData1, signature);

      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("4995"));

      // User attempts to claim another challenge worth 10 RUN => Cap should freeze balance at 10_000, but transaction should succeed
      await core.addSoloChallenge(1, 9999, ethers.parseEther("10"));
      const runData2 = { user: user.address, distance: 10, time: 10, date: 2 };
      signature = await backendSigner.signTypedData(domain, types, runData2);

      await core.connect(user).claimSoloChallenge(1, runData2, signature);

      // Remaining 5 RUN are burned/ignored safely
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("5000"));
    });
  })

  describe("createMultiChallenge(uint256 _distanceTarget, uint256 _timeMax, uint256 _stakeAmount, uint256 _duration)", function () {
    it("Should only allow a registered runner to create a multi challenge", async function () {
      await expect(core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600))
        .to.be.revertedWith("Not registered");
    });
    it("Should only allow user to create a multi challenge with a stake amount > 0", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("0"), 3600))
        .to.be.revertedWith("Stake must be > 0");
    });
    it("Should only allow user to create a multi challenge with a stake amount <= MAX_BALANCE", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("5001"), 3600))
        .to.be.revertedWith("Stake must be <= MAX_BALANCE");
    });
    it("Should only allow user to create a multi challenge with a duration > 0", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 0))
        .to.be.revertedWith("Duration must be > 0");
    });
    it("Should only allow user to create a multi challenge with a distance target > 0", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).createMultiChallenge(0, 3600, ethers.parseEther("10"), 3600))
        .to.be.revertedWith("Distance target must be > 0");
    });
    it("Should only allow user to create a multi challenge with a time max > 0", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).createMultiChallenge(5000, 0, ethers.parseEther("10"), 3600))
        .to.be.revertedWith("Time max must be > 0");
    });
    it("Should escrow the stake amount", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("20")); // 5km, 1hr, 20 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
      expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("10"));
    });

    it("Should emit MultiChallengeCreated event", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      const tx = await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const expectedDeadline = block!.timestamp + 3600;
      await expect(tx)
        .to.emit(core, "MultiChallengeCreated")
        .withArgs(0, user.address, ethers.parseEther("10"), 5000, 3600, expectedDeadline);
    });
  })

  describe("joinMultiChallenge(uint256 _challengeId)", function () {
    it("Should only allow a registered runner to join a multi challenge", async function () {
      await expect(core.connect(user).joinMultiChallenge(0))
        .to.be.revertedWith("Not registered");
    });
    it("Should only allow user to join a multi challenge if the challenge exists", async function () {
      await core.connect(user).registerRunner();
      await expect(core.connect(user).joinMultiChallenge(0))
        .to.be.revertedWith("Challenge does not exist");
    });
    it("Should only allow user to join a multi challenge once", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      await expect(core.connect(user).joinMultiChallenge(0))
        .to.be.revertedWith("Already joined");
    });
    it("Should not allow user to join multi challenge if expired", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);

      await networkHelpers.time.increase(3600);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await expect(core.connect(challenger).joinMultiChallenge(0))
        .to.be.revertedWith("Challenge expired");
    });
    it("should escrow the stake amount", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);

      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("0"));
      expect(await token.balanceOf(challenger.address)).to.equal(ethers.parseEther("0"));
      expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("20"));
    });
    it("should emit MultiChallengeJoined event", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      const tx = await core.connect(challenger).joinMultiChallenge(0);
      await expect(tx)
        .to.emit(core, "MultiChallengeJoined")
        .withArgs(0, challenger.address, ethers.parseEther("10"));
    });
  })

  describe("submitMultiplayerResult(uint256 _challengeId, RunData calldata _runData, bytes calldata _signature)", function () {
    it("Should not allow user to submit a result if challenge deadline passed", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      await networkHelpers.time.increase(3600);
      await expect(core.connect(user).submitMultiplayerResult(0, runData, signature))
        .to.be.revertedWith("Challenge deadline passed");
    });
    it("Should not allow user to submit results twice", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);
      const { runData: runData3, signature: signature3 } = await setUpRundataAndSignature(challenger, 5200, 3200);
      await core.connect(challenger).submitMultiplayerResult(0, runData3, signature3);
      await expect(core.connect(challenger).submitMultiplayerResult(0, runData3, signature3))
        .to.be.revertedWith("Already submitted your result");
    })
  })

  describe("resolveMultiChallenge(uint256 _challengeId)", function () {
    it("Should not allow user to resolve a multi challenge if the deadline has not passed", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);
      await expect(core.connect(user).resolveMultiChallenge(0))
        .to.be.revertedWith("Challenge deadline not yet passed");
    })
    it("Should not allow user to resolve a multi challenge if he is not a participant", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await networkHelpers.time.increase(3600);
      await expect(core.connect(challenger).resolveMultiChallenge(0))
        .to.be.revertedWith("Only admin or participant can resolve");
    })
    it("Should allow user to resolve a multi challenge if the deadline has passed and he is a participant", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);
      const { runData: runData3, signature: signature3 } = await setUpRundataAndSignature(challenger, 5200, 3200);
      await core.connect(challenger).submitMultiplayerResult(0, runData3, signature3);
      await networkHelpers.time.increase(3600);
      await expect(core.connect(user).resolveMultiChallenge(0))
        .to.emit(core, "MultiChallengeCompleted")
        .withArgs(0, challenger.address, ethers.parseEther("16")); // 80% of 20 RUN
    })
    it("Should reward the user with 80% of the pot if he wins the challenge", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);
      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);
      const { runData: runData3, signature: signature3 } = await setUpRundataAndSignature(challenger, 5200, 3200);
      await core.connect(challenger).submitMultiplayerResult(0, runData3, signature3);
      await networkHelpers.time.increase(3600);
      await core.connect(user).resolveMultiChallenge(0);
      expect(await token.balanceOf(challenger.address)).to.equal(ethers.parseEther("16"));
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("0"));
      expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("0"));
    })
  })

  describe("claimRefund(uint256 _challengeId)", function () {
    it("Should refund all participants when nobody submitted results", async function () {
      // Setup: user creates challenge, challenger joins
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10"));
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);

      // Verify stakes are escrowed
      expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("20"));

      // Deadline passes — nobody runs!
      await networkHelpers.time.increase(3600);

      // Resolve with no winner
      await core.connect(user).resolveMultiChallenge(0);

      // Both players can claim refund even though challenge is "completed"
      await core.connect(user).claimRefund(0);
      await core.connect(challenger).claimRefund(0);

      // All tokens returned
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
      expect(await token.balanceOf(challenger.address)).to.equal(ethers.parseEther("10"));
      expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("0"));
    });

    it("Should NOT allow refunds when the challenge has a winner", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10"));
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      const { runData: runData2, signature: signature2 } = await setUpRundataAndSignature(challenger);
      await core.connect(challenger).registerRunner();
      await core.connect(challenger).claimSoloChallenge(0, runData2, signature2);
      await token.connect(challenger).approve(core.target, ethers.parseEther("10"));
      await core.connect(challenger).joinMultiChallenge(0);

      // Challenger submits result → becomes winner
      const { runData: runData3, signature: signature3 } = await setUpRundataAndSignature(challenger, 5200, 3200);
      await core.connect(challenger).submitMultiplayerResult(0, runData3, signature3);

      await networkHelpers.time.increase(3600);
      await core.connect(user).resolveMultiChallenge(0);

      // User tries to get refund after losing → should fail
      await expect(core.connect(user).claimRefund(0))
        .to.be.revertedWith("Challenge completed with a winner, no refund");
    });

    it("Should prevent double refund", async function () {
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10"));
      await core.connect(user).registerRunner();
      await core.connect(user).claimSoloChallenge(0, runData, signature);
      await token.connect(user).approve(core.target, ethers.parseEther("10"));
      await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("10"), 3600);

      await networkHelpers.time.increase(3600);
      await core.connect(user).resolveMultiChallenge(0);
      await core.connect(user).claimRefund(0);

      // Try again → should fail
      await expect(core.connect(user).claimRefund(0))
        .to.be.revertedWith("Not a participant or already refunded");
    });
  })

  describe("setPromoCost(uint256 _promoId, uint256 _cost)", function () {
    it("Should allow admin to set a promo code cost", async function () {
      await core.setPromoCost(0, ethers.parseEther("10"));
      expect(await core.promoCosts(0)).to.equal(ethers.parseEther("10"));
    })

    it("Should emit PromoAdded event", async function () {
      await expect(core.setPromoCost(0, ethers.parseEther("10")))
        .to.emit(core, "PromoAdded").withArgs(0, ethers.parseEther("10"));
    })

    it("Should not allow non-admin to add a promo code", async function () {
      await expect(core.connect(user).setPromoCost(0, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(core, "OwnableUnauthorizedAccount").withArgs(user.address);
    })
  })

  describe("buyPromoCode(uint256 _promoId)", function () {
    it("Should allow user to buy a promo code", async function () {
      await core.setPromoCost(0, ethers.parseEther("10"));
      await core.connect(user).registerRunner();
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).claimSoloChallenge(0, runData, signature)
      await core.connect(user).buyPromoCode(0);
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("0"));
    })

    it("Should emit PromoCodeBought event", async function () {
      await core.setPromoCost(0, ethers.parseEther("10"));
      await core.connect(user).registerRunner();
      const { runData, signature } = await setUpRundataAndSignature();
      await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN
      await core.connect(user).claimSoloChallenge(0, runData, signature)
      await expect(core.connect(user).buyPromoCode(0))
        .to.emit(core, "PromoCodeBought").withArgs(user.address, 0, ethers.parseEther("10"));
    })
  })

});


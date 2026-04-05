import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Runity Security Architecture & Logic", function () {
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
      { name: "date", type: "uint256" },
      { name: "steps", type: "uint256" },
      { name: "avgSpeed", type: "uint256" },
      { name: "maxSpeed", type: "uint256" }
    ]
  };

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

  it("Should properly verify EIP-712 signature and reward solo challenge", async function () {
    await core.connect(user).registerRunner();
    
    await core.addSoloChallenge(5000, 3600, ethers.parseEther("10")); // 5km, 1hr, 10 RUN

    const runData = {
      user: user.address,
      distance: 5100, 
      time: 3500, 
      date: Math.floor(Date.now() / 1000),
      steps: 6000,
      avgSpeed: 200,
      maxSpeed: 300
    };

    // EIP-712 Typed Data Signature
    const signature = await backendSigner.signTypedData(domain, types, runData);

    await expect(core.connect(user).claimSoloChallenge(0, runData, signature))
      .to.emit(core, "SoloChallengeWon")
      .withArgs(user.address, 0);

    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should safely cap rewards at MAX_BALANCE to prevent DoS", async function () {
    await core.connect(user).registerRunner();
    
    // Give user 9995 RUN manually through core via a massive solo challenge
    await core.addSoloChallenge(1, 9999, ethers.parseEther("9995"));
    const runData1 = { user: user.address, distance: 10, time: 10, date: 1, steps: 1, avgSpeed: 1, maxSpeed: 1 };
    let signature = await backendSigner.signTypedData(domain, types, runData1);
    await core.connect(user).claimSoloChallenge(0, runData1, signature);
    
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("9995"));

    // User attempts to claim another challenge worth 10 RUN => Cap should freeze balance at 10_000, but transaction should succeed
    await core.addSoloChallenge(1, 9999, ethers.parseEther("10"));
    const runData2 = { user: user.address, distance: 10, time: 10, date: 2, steps: 1, avgSpeed: 1, maxSpeed: 1 };
    signature = await backendSigner.signTypedData(domain, types, runData2);
    
    await core.connect(user).claimSoloChallenge(1, runData2, signature);

    // Remaining 5 RUN are burned/ignored safely
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("10000"));
  });

  it("Should prevent double joining (Refund Trap fix) and escrow correctly", async function () {
    await core.connect(user).registerRunner();
    await core.connect(challenger).registerRunner();
    
    // Setup challenger with enough balance to stake
    await core.addSoloChallenge(1, 9999, ethers.parseEther("50"));
    const cData = { user: challenger.address, distance: 10, time: 10, date: 3, steps: 1, avgSpeed: 1, maxSpeed: 1 };
    const cSig = await backendSigner.signTypedData(domain, types, cData);
    await core.connect(challenger).claimSoloChallenge(0, cData, cSig);

    // Setup user
    const uData = { user: user.address, distance: 10, time: 10, date: 4, steps: 1, avgSpeed: 1, maxSpeed: 1 };
    const uSig = await backendSigner.signTypedData(domain, types, uData);
    await core.connect(user).claimSoloChallenge(0, uData, uSig);

    // Create Multiplayer Challenge
    await core.connect(user).createMultiChallenge(5000, 3600, ethers.parseEther("20"), 86400);
    
    // Challenger joins
    await core.connect(challenger).joinMultiChallenge(0);

    // Challenger tries to double join
    await expect(core.connect(challenger).joinMultiChallenge(0))
        .to.be.revertedWith("Already joined");

    // Stake has been escrowed
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("30"));
    expect(await token.balanceOf(challenger.address)).to.equal(ethers.parseEther("30"));
    expect(await token.balanceOf(core.target)).to.equal(ethers.parseEther("40")); // 20 + 20

    // Win
    const winData = { user: user.address, distance: 5100, time: 3500, date: 5, steps: 6000, avgSpeed: 200, maxSpeed: 300 };
    const winSig = await backendSigner.signTypedData(domain, types, winData);
    await core.connect(user).submitMultiplayerResult(0, winData, winSig);
    
    // User claims whole pool
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("70")); // 30 + 40
    expect(await token.balanceOf(core.target)).to.equal(0);
  });
});

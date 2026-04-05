import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RunCoreModule", (m) => {
    // 1. Get a signer address for the backend (e.g. from hardhat accounts)
    // Account 0 is deployer, let's use account 1 or any other param you prefer
    const backendSigner = m.getParameter("backendSigner", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); 

    // 2. Deploy RunToken
    const runToken = m.contract("RunToken");

    // 3. Deploy RunCore, passing the runToken *Future* directly! 
    // Ignition will automatically resolve `runToken` to its deployed address.
    const runCore = m.contract("RunCore", [runToken, backendSigner]);

    // 4. Link the RunCore contract inside RunToken for Escrow & Mint permissions
    m.call(runToken, "setCoreContract", [runCore]);

    return { runCore, runToken };
});
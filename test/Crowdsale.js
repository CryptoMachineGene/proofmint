const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

before(async () => {
  const A = await artifacts.readArtifact("contracts/Crowdsale.sol:Crowdsale");
  const ctor = A.abi.find((f) => f.type === "constructor");
  console.log("DEBUG ctor inputs:", ctor?.inputs);
});

async function deployCrowdsaleFixture() {
  const [owner, alice, bob, carol] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("contracts/Token.sol:Token");
  const token = await Token.deploy("Sakura", "SKR");
  await token.waitForDeployment();

  const rate = ethers.parseUnits("1000", 18);
  const cap = ethers.parseEther("10");
  const tokenAddr = await token.getAddress();

  const sale = await ethers.deployContract(
    "contracts/Crowdsale.sol:Crowdsale",
    [tokenAddr, rate, cap]
  );
  await sale.waitForDeployment();

  await (await token.setMinter(await sale.getAddress())).wait();

  return { owner, alice, bob, carol, token, crowdsale: sale, rate, cap };
}

describe("Deployment (fresh)", () => {
  it("reverts when token address is zero", async () => {
    const rate = ethers.parseUnits("1000", 18);
    const cap = ethers.parseEther("1");
    await expect(
      ethers.deployContract("contracts/Crowdsale.sol:Crowdsale",
        [ethers.ZeroAddress, rate, cap])
    ).to.be.revertedWith("token addr=0");
  });

  it("reverts when rate is zero", async () => {
    const Token = await ethers.getContractFactory("contracts/Token.sol:Token");
    const token = await Token.deploy("Sakura", "SKR");
    await token.waitForDeployment();
    const cap = ethers.parseEther("1");
    await expect(
      ethers.deployContract("contracts/Crowdsale.sol:Crowdsale",
        [await token.getAddress(), 0n, cap])
    ).to.be.revertedWith("rate=0");
  });

  it("reverts when cap is zero", async () => {
    const Token = await ethers.getContractFactory("contracts/Token.sol:Token");
    const token = await Token.deploy("Sakura", "SKR");
    await token.waitForDeployment();
    const rate = ethers.parseUnits("1000", 18);
    await expect(
      ethers.deployContract("contracts/Crowdsale.sol:Crowdsale",
        [await token.getAddress(), rate, 0n])
    ).to.be.revertedWith("cap=0");
  });

  it("stores constructor params correctly", async () => {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("contracts/Token.sol:Token");
    const token = await Token.deploy("Sakura", "SKR"); await token.waitForDeployment();
    const rate = ethers.parseUnits("1000", 18);
    const cap  = ethers.parseEther("10");
    const sale = await ethers.deployContract(
      "contracts/Crowdsale.sol:Crowdsale",
      [await token.getAddress(), rate, cap]
    );
    await sale.waitForDeployment();
    expect(await sale.token()).to.equal(await token.getAddress());
    expect(await sale.owner()).to.equal(owner.address);
    expect(await sale.rate()).to.equal(rate);
    expect(await sale.cap()).to.equal(cap);
    expect(await sale.weiRaised()).to.equal(0n);
  });
});

describe("Post-deploy behavior", () => {
  let owner, alice, bob, carol, token, crowdsale, rate, cap;
  beforeEach(async () => {
    ({ owner, alice, bob, carol, token, crowdsale, rate, cap } =
      await loadFixture(deployCrowdsaleFixture));
  });

  it("mints correct amount via buyTokens()", async () => {
    const send = ethers.parseEther("0.5");
    const expected = (send * rate) / ethers.parseEther("1");
    await expect(crowdsale.connect(alice).buyTokens({ value: send }))
      .to.emit(crowdsale, "TokensPurchased").withArgs(alice.address, send, expected);
    expect(await token.balanceOf(alice.address)).to.equal(expected);
    expect(await crowdsale.weiRaised()).to.equal(send);
  });

  it("mints via receive() on plain ETH", async () => {
    const send = ethers.parseEther("1");
    const expected = (send * rate) / ethers.parseEther("1");
    await bob.sendTransaction({ to: await crowdsale.getAddress(), value: send });
    expect(await token.balanceOf(bob.address)).to.equal(expected);
    expect(await crowdsale.weiRaised()).to.equal(send);
  });

  it("enforces cap at the boundary", async () => {
    await crowdsale.connect(alice).buyTokens({ value: cap });
    expect(await crowdsale.weiRaised()).to.equal(cap);
    await expect(crowdsale.connect(alice).buyTokens({ value: 1n }))
      .to.be.revertedWith("cap reached");
  });

  it("only owner can withdraw and funds move", async () => {
    await crowdsale.connect(alice).buyTokens({ value: ethers.parseEther("1") });
    await expect(crowdsale.connect(alice).withdraw()).to.be.revertedWith("not owner");
    await expect(crowdsale.withdraw()).to.changeEtherBalances(
      [crowdsale, (await ethers.getSigners())[0]],
      [ethers.parseEther("-1"), ethers.parseEther("1")]
    );
  });
});

describe("Security: nonReentrant", () => {
  it("blocks reentrancy during buyTokens via malicious token", async () => {
    const [, attacker] = await ethers.getSigners();
    const R = await ethers.getContractFactory("contracts/MockTokenReenter.sol:MockTokenReenter");
    const m = await R.deploy(); await m.waitForDeployment();
    const rate = ethers.parseUnits("1000", 18);
    const cap  = ethers.parseEther("5");
    const sale = await ethers.deployContract(
      "contracts/Crowdsale.sol:Crowdsale",
      [await m.getAddress(), rate, cap]
    );
    await sale.waitForDeployment();
    await (await m.setMinter(await sale.getAddress())).wait();
    await (await m.setCrowdsaleTarget(await sale.getAddress())).wait();
    await expect(
      sale.connect(attacker).buyTokens({ value: ethers.parseEther("1") })
    ).to.be.reverted;
  });
});

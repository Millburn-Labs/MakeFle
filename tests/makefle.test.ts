
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("staking contract tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("should allow staking STX", () => {
    const stakeAmount = 1000000; // 1 STX in microSTX
    const { result } = simnet.callPublicFn(
      "makefle",
      "stake",
      [Cl.uint(stakeAmount)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check staked balance
    const balanceResult = simnet.callReadOnlyFn(
      "makefle",
      "get-staked-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balanceResult.result).toBeOk(Cl.uint(stakeAmount));
  });

  it("should track total staked amount", () => {
    const stakeAmount1 = 1000000;
    const stakeAmount2 = 2000000;

    simnet.callPublicFn("makefle", "stake", [Cl.uint(stakeAmount1)], address1);
    simnet.callPublicFn("makefle", "stake", [Cl.uint(stakeAmount2)], address2);

    const totalResult = simnet.callReadOnlyFn(
      "makefle",
      "get-total-staked",
      [],
      address1
    );
    expect(totalResult.result).toBeOk(Cl.uint(stakeAmount1 + stakeAmount2));
  });

  it("should allow unstaking STX", () => {
    const stakeAmount = 1000000;
    const unstakeAmount = 500000;

    // First stake
    simnet.callPublicFn("makefle", "stake", [Cl.uint(stakeAmount)], address1);

    // Then unstake
    const { result } = simnet.callPublicFn(
      "makefle",
      "unstake",
      [Cl.uint(unstakeAmount)],
      address1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check remaining balance
    const balanceResult = simnet.callReadOnlyFn(
      "makefle",
      "get-staked-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balanceResult.result).toBeOk(Cl.uint(stakeAmount - unstakeAmount));
  });

  it("should prevent unstaking more than staked", () => {
    const stakeAmount = 1000000;
    const unstakeAmount = 2000000;

    simnet.callPublicFn("makefle", "stake", [Cl.uint(stakeAmount)], address1);

    const { result } = simnet.callPublicFn(
      "makefle",
      "unstake",
      [Cl.uint(unstakeAmount)],
      address1
    );
    expect(result).toBeErr(Cl.uint(101)); // ERR-INSUFFICIENT-BALANCE
  });

  it("should return pending rewards", () => {
    const stakeAmount = 1000000;
    simnet.callPublicFn("makefle", "stake", [Cl.uint(stakeAmount)], address1);

    // Advance blocks to accumulate rewards
    simnet.mineEmptyBlocks(10);

    const rewardsResult = simnet.callReadOnlyFn(
      "makefle",
      "get-pending-rewards",
      [Cl.principal(address1)],
      address1
    );
    expect(rewardsResult.result).toBeOk(Cl.uint(expect.any(Number)));
  });

  it("should get reward rate", () => {
    const rateResult = simnet.callReadOnlyFn(
      "makefle",
      "get-reward-rate",
      [],
      address1
    );
    expect(rateResult.result).toBeOk(Cl.uint(100));
  });
});

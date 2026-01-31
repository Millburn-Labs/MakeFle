/**
 * Example usage of the staking contract with @stacks/connect and @stacks/transactions
 * 
 * This file demonstrates how to interact with the staking contract using:
 * - @stacks/connect for wallet integration
 * - @stacks/transactions for building and broadcasting transactions
 */

import { openContractCall } from '@stacks/connect';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  contractPrincipalCV,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  getAddressFromPrivateKey,
  StacksTestnet,
  StacksMainnet,
  callReadOnlyFunction,
  cvToJSON,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

// Contract configuration
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Replace with your contract address
const CONTRACT_NAME = 'makefle';
const NETWORK = new StacksTestnet(); // Change to StacksMainnet for mainnet

// Helper function to get contract principal
function getContractPrincipal() {
  return contractPrincipalCV(CONTRACT_ADDRESS, CONTRACT_NAME);
}

/**
 * Example 1: Using @stacks/connect for user-friendly wallet integration
 * This opens the Stacks Wallet Connect UI for the user to sign
 */
export async function stakeWithConnect(amount: bigint) {
  const functionArgs = [uintCV(amount)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'stake',
    functionArgs,
    network: NETWORK,
    appDetails: {
      name: 'Staking App',
      icon: 'https://example.com/icon.png', // Replace with your app icon
    },
    onFinish: (data) => {
      console.log('Transaction submitted:', data.txId);
      console.log('Transaction hex:', data.txRaw);
    },
    onCancel: () => {
      console.log('User cancelled the transaction');
    },
  });
}

/**
 * Example 2: Using @stacks/transactions directly for programmatic transactions
 * This requires a private key and gives you more control
 */
export async function stakeWithTransactions(
  privateKey: string,
  amount: bigint
) {
  const senderKey = privateKey;
  const senderAddress = getAddressFromPrivateKey(senderKey, NETWORK.version);

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'stake',
    functionArgs: [uintCV(amount)],
    senderKey,
    fee: 1000, // Transaction fee in microSTX
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amount
      ),
    ],
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Transaction ID:', broadcastResponse.txid);
  return broadcastResponse;
}

/**
 * Example 3: Unstake tokens using @stacks/connect
 */
export async function unstakeWithConnect(amount: bigint) {
  const functionArgs = [uintCV(amount)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'unstake',
    functionArgs,
    network: NETWORK,
    appDetails: {
      name: 'Staking App',
      icon: 'https://example.com/icon.png',
    },
    onFinish: (data) => {
      console.log('Unstake transaction submitted:', data.txId);
    },
    onCancel: () => {
      console.log('User cancelled the transaction');
    },
  });
}

/**
 * Example 4: Claim rewards using @stacks/transactions
 */
export async function claimRewardsWithTransactions(privateKey: string) {
  const senderKey = privateKey;

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'claim-rewards',
    functionArgs: [],
    senderKey,
    fee: 1000,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Claim rewards transaction ID:', broadcastResponse.txid);
  return broadcastResponse;
}

/**
 * Example 5: Read-only function calls (no transaction needed)
 */
export async function getStakedBalance(userAddress: string) {
  const functionArgs = [standardPrincipalCV(userAddress)];
  
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'get-staked-balance',
    functionArgs,
    network: NETWORK,
    senderAddress: userAddress,
  });

  const json = cvToJSON(result);
  console.log('Staked balance:', json.value);
  return json.value;
}

export async function getTotalStaked() {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'get-total-staked',
    functionArgs: [],
    network: NETWORK,
    senderAddress: CONTRACT_ADDRESS,
  });

  const json = cvToJSON(result);
  console.log('Total staked:', json.value);
  return json.value;
}

export async function getPendingRewards(userAddress: string) {
  const functionArgs = [standardPrincipalCV(userAddress)];
  
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'get-pending-rewards',
    functionArgs,
    network: NETWORK,
    senderAddress: userAddress,
  });

  const json = cvToJSON(result);
  console.log('Pending rewards:', json.value);
  return json.value;
}

/**
 * Example usage in a React component or Node.js script:
 * 
 * // Using @stacks/connect (user-friendly, opens wallet)
 * await stakeWithConnect(1000000n); // Stake 1 STX (in microSTX)
 * 
 * // Using @stacks/transactions (programmatic, requires private key)
 * const privateKey = 'your-private-key-here';
 * await stakeWithTransactions(privateKey, 1000000n);
 * 
 * // Read-only calls (no transaction needed)
 * const balance = await getStakedBalance('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
 * const total = await getTotalStaked();
 * const rewards = await getPendingRewards('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
 */

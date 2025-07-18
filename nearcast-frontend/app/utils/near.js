import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { providers, utils } from "near-api-js";

export const CONTRACT_ID = "bansal_ishaan.testnet"; // Change if needed
export const NETWORK_ID = "testnet";

let selector = null, modal = null, accountId = null, wallet = null;

export async function initWalletSelector() {
  if (selector) return selector;
  selector = await setupWalletSelector({
    network: NETWORK_ID,
    modules: [setupNearWallet()],
  });
  modal = setupModal(selector, { contractId: CONTRACT_ID });
  return selector;
}

export async function walletLogin() {
  await initWalletSelector();
  modal.show();
}

export async function walletLogout() {
  if (selector && (await selector.isSignedIn())) {
    const w = await selector.wallet();
    await w.signOut();
    window.location.reload();
  }
}

export async function walletAccountId() {
  await initWalletSelector();
  const state = selector.store.getState();
  if (state.accounts.length) {
    accountId = state.accounts.find((a) => a.active)?.accountId;
  }
  return accountId;
}

export async function callMethod({ method, args = {}, deposit }) {
  await initWalletSelector();
  const w = await selector.wallet();
  // Parse NEAR to yocto ⬇
  const yocto = deposit ? utils.format.parseNearAmount(deposit) : "0";
  return await w.signAndSendTransaction({
    signerId: accountId || (await walletAccountId()),
    receiverId: CONTRACT_ID,
    actions: [{
      type: "FunctionCall",
      params: {
        methodName: method,
        args,
        deposit: yocto,
        gas: "300000000000000", // 300Tgas
      },
    }],
  });
}

export async function viewMethod(method, args = {}) {
  const provider = new providers.JsonRpcProvider({ url: `https://rpc.${NETWORK_ID}.near.org` });
  const res = await provider.query({
    request_type: "call_function",
    account_id: CONTRACT_ID,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  return JSON.parse(Buffer.from(res.result).toString());
}

import { setupWalletSelector } from "@near-wallet-selector/core"
import { setupModal } from "@near-wallet-selector/modal-ui"
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet"
import { providers, utils } from "near-api-js"

export const CONTRACT_ID = "bansal_ishaan.testnet"
export const NETWORK_ID = "testnet"

let selector, modal

export async function initWalletSelector() {
  if (selector) return selector

  const myNearWallet = setupMyNearWallet({
    walletUrl: "https://testnet.mynearwallet.com", // required for testnet
  })

  selector = await setupWalletSelector({
    network: NETWORK_ID,
    modules: [myNearWallet],
  })

  modal = setupModal(selector, {
    contractId: CONTRACT_ID,
    description: "Sign in with MyNearWallet to use NEARCast!",
  })

  return selector
}

export async function login() {
  await initWalletSelector()
  modal.show()
}

export async function logout() {
  await initWalletSelector()
  if (await selector.isSignedIn()) {
    const wallet = await selector.wallet()
    await wallet.signOut()
    window.location.reload()
  }
}

export async function getAccountId() {
  await initWalletSelector()
  const state = selector.store.getState()
  const acc = state.accounts.find((a) => a.active)
  return acc ? acc.accountId : null
}

export async function callMethod({ method, args = {}, deposit = "0" }) {
  try {
    await initWalletSelector()
    const wallet = await selector.wallet()
    const accountId = await getAccountId()

    if (!accountId) {
      throw new Error("No account connected")
    }

    const depositYocto = utils.format.parseNearAmount(deposit)

    console.log("Calling method:", method, "with args:", args, "deposit:", deposit)

    const result = await wallet.signAndSendTransaction({
      signerId: accountId,
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: method,
            args,
            gas: "300000000000000",
            deposit: depositYocto,
          },
        },
      ],
    })

    console.log("Transaction result:", result)
    return result
  } catch (error) {
    console.error("Error calling method:", error)
    throw error
  }
}

export async function viewMethod(method, args = {}) {
  const provider = new providers.JsonRpcProvider({
    url: `https://rpc.${NETWORK_ID}.near.org`,
  })

  const res = await provider.query({
    request_type: "call_function",
    account_id: CONTRACT_ID,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  })

  return JSON.parse(Buffer.from(res.result).toString())
}

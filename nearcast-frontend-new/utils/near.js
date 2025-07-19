import { setupWalletSelector } from "@near-wallet-selector/core"
import { setupModal } from "@near-wallet-selector/modal-ui"
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet"
import { providers, utils } from "near-api-js"

export const CONTRACT_ID = "bansal_ishaan.testnet"
export const NETWORK_ID = "testnet"

let selector, modal

export async function initWalletSelector() {
  if (selector) return selector

  try {
    const myNearWallet = setupMyNearWallet({
      walletUrl: "https://testnet.mynearwallet.com",
      iconUrl: "https://yourdomain.com/yourwallet-icon.png",
    })

    selector = await setupWalletSelector({
      network: NETWORK_ID,
      modules: [myNearWallet],
      debug: false, // Set to false to reduce console noise
    })

    modal = setupModal(selector, {
      contractId: CONTRACT_ID,
      description: "Connect your NEAR wallet to use NEARCast!",
      theme: "dark",
    })

    return selector
  } catch (error) {
    console.error("Failed to initialize wallet selector:", error)
    throw new Error("Failed to initialize NEAR wallet connection")
  }
}

export async function login() {
  try {
    await initWalletSelector()
    if (modal) {
      modal.show()
    } else {
      throw new Error("Wallet modal not initialized")
    }
  } catch (error) {
    console.error("Login error:", error)
    throw new Error("Failed to open wallet connection dialog")
  }
}

export async function logout() {
  try {
    await initWalletSelector()
    const isSignedIn = await selector.isSignedIn()
    if (isSignedIn) {
      const wallet = await selector.wallet()
      await wallet.signOut()
      window.location.reload()
    }
  } catch (error) {
    console.error("Logout error:", error)
    // Still reload the page even if logout fails
    window.location.reload()
  }
}

export async function getAccountId() {
  try {
    await initWalletSelector()
    const state = selector.store.getState()
    const activeAccount = state.accounts.find((account) => account.active)
    return activeAccount ? activeAccount.accountId : null
  } catch (error) {
    console.error("Error getting account ID:", error)
    return null
  }
}

export async function callMethod({ method, args = {}, deposit = "0", gas = "300000000000000" }) {
  try {
    await initWalletSelector()
    const wallet = await selector.wallet()
    const accountId = await getAccountId()

    if (!accountId) {
      throw new Error("No NEAR account connected. Please connect your wallet first.")
    }

    let depositYocto
    if (deposit === "0") {
      depositYocto = "0"
    } else {
      depositYocto = utils.format.parseNearAmount(deposit)
    }

    console.log("Calling method:", method, "with args:", args, "deposit:", deposit, "gas:", gas)

    const result = await wallet.signAndSendTransaction({
      signerId: accountId,
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: method,
            args,
            gas,
            deposit: depositYocto,
          },
        },
      ],
    })

    console.log("Transaction result:", result)
    return result
  } catch (error) {
    console.error("Error calling method:", error)
    if (error.message.includes("User rejected")) {
      throw new Error("Transaction was cancelled by user")
    } else if (error.message.includes("Not enough balance")) {
      throw new Error("Insufficient NEAR balance for this transaction")
    } else {
      throw error
    }
  }
}

export async function viewMethod(method, args = {}, retries = 3, delay = 1000) {
  const provider = new providers.JsonRpcProvider({
    url: "https://public-rpc.blockpi.io/http/near-testnet",
  })

  for (let i = 0; i < retries; i++) {
    try {
      const res = await provider.query({
        request_type: "call_function",
        account_id: CONTRACT_ID,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
        finality: "optimistic",
      })

      return JSON.parse(Buffer.from(res.result).toString())
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for viewMethod ${method}:`, error)
      if (i < retries - 1) {
        // Only retry if it's not the last attempt
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      } else {
        // If all retries fail, re-throw the error
        throw new Error(`Failed to call ${method} after ${retries} attempts: ${error.message}`)
      }
    }
  }
}

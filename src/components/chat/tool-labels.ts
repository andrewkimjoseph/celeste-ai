const TOOL_LABELS: Record<string, { inProgress: string; done: string }> = {
  get_account: {
    inProgress: "Loading account…",
    done: "Account loaded",
  },
  get_stablecoin_balances: {
    inProgress: "Checking stablecoin balances…",
    done: "Balances loaded",
  },
  get_celo_balances: {
    inProgress: "Checking token balances…",
    done: "Balances loaded",
  },
  get_token_info: {
    inProgress: "Loading token info…",
    done: "Token info loaded",
  },
  get_token_balance: {
    inProgress: "Checking token balance…",
    done: "Balance loaded",
  },
  get_mento_fx_quote: {
    inProgress: "Getting FX quote…",
    done: "Quote ready",
  },
  get_swap_quote: {
    inProgress: "Finding best swap route…",
    done: "Quote ready",
  },
  get_uniswap_quote: {
    inProgress: "Getting Uniswap quote…",
    done: "Quote ready",
  },
  estimate_send: {
    inProgress: "Estimating send gas…",
    done: "Send estimate ready",
  },
  estimate_mento_fx: {
    inProgress: "Estimating swap gas…",
    done: "Swap estimate ready",
  },
  estimate_uniswap_swap: {
    inProgress: "Estimating Uniswap swap gas…",
    done: "Swap estimate ready",
  },
  get_gas_fee_data: {
    inProgress: "Fetching gas fees…",
    done: "Gas fees loaded",
  },
  estimate_transaction: {
    inProgress: "Estimating transaction gas…",
    done: "Estimate ready",
  },
  get_gooddollar_whitelisting_info: {
    inProgress: "Checking GoodDollar status…",
    done: "GoodDollar status loaded",
  },
  get_gooddollar_ubi_entitlement: {
    inProgress: "Checking GoodDollar UBI eligibility…",
    done: "UBI eligibility loaded",
  },
  resolve_ens: {
    inProgress: "Resolving ENS name…",
    done: "ENS resolved",
  },
  get_network_status: {
    inProgress: "Checking network status…",
    done: "Network status loaded",
  },
  get_block: {
    inProgress: "Fetching block…",
    done: "Block loaded",
  },
  get_latest_blocks: {
    inProgress: "Fetching recent blocks…",
    done: "Blocks loaded",
  },
  get_transaction: {
    inProgress: "Fetching transaction…",
    done: "Transaction loaded",
  },
  get_governance_proposals: {
    inProgress: "Loading governance proposals…",
    done: "Proposals loaded",
  },
  get_proposal_details: {
    inProgress: "Loading proposal details…",
    done: "Proposal loaded",
  },
  get_staking_balances: {
    inProgress: "Checking staking balances…",
    done: "Staking balances loaded",
  },
  get_activatable_stakes: {
    inProgress: "Checking activatable stakes…",
    done: "Activatable stakes loaded",
  },
  get_validator_groups: {
    inProgress: "Loading validator groups…",
    done: "Validator groups loaded",
  },
  get_validator_group_details: {
    inProgress: "Loading validator group…",
    done: "Validator group loaded",
  },
  get_total_staking_info: {
    inProgress: "Loading staking metrics…",
    done: "Staking metrics loaded",
  },
  get_nft_info: {
    inProgress: "Loading NFT metadata…",
    done: "NFT info loaded",
  },
  get_nft_balance: {
    inProgress: "Checking NFT balance…",
    done: "NFT balance loaded",
  },
  call_contract_function: {
    inProgress: "Calling contract…",
    done: "Contract read complete",
  },
  estimate_contract_gas: {
    inProgress: "Estimating contract gas…",
    done: "Contract gas estimate ready",
  },
  prepare_send: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_mento_fx: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_swap: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_uniswap_swap: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_aave_supply: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_aave_withdraw: {
    inProgress: "Preparing transaction…",
    done: "Transaction prepared",
  },
  prepare_claim_daily_gooddollar_ubi: {
    inProgress: "Preparing UBI claim…",
    done: "UBI claim prepared",
  },
};

export function getToolLabels(toolName: string): {
  inProgress: string;
  done: string;
} {
  const labels = TOOL_LABELS[toolName];
  if (labels) {
    return labels;
  }

  const readable = toolName.replaceAll("_", " ");
  return {
    inProgress: `Running ${readable}…`,
    done: "Done",
  };
}

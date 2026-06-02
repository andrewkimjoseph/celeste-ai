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
  get_carbon_strategies: {
    inProgress: "Loading Carbon strategies…",
    done: "Carbon strategies loaded",
  },
  explore_carbon_pair: {
    inProgress: "Exploring Carbon pair…",
    done: "Carbon pair loaded",
  },
  get_carbon_trade_quote: {
    inProgress: "Getting Carbon trade quote…",
    done: "Carbon quote ready",
  },
  simulate_carbon_strategy: {
    inProgress: "Simulating Carbon strategy…",
    done: "Simulation complete",
  },
  get_carbon_activity: {
    inProgress: "Loading Carbon activity…",
    done: "Carbon activity loaded",
  },
  carbon_help: {
    inProgress: "Loading Carbon help…",
    done: "Carbon help loaded",
  },
  prepare_carbon_limit_order: {
    inProgress: "Preparing Carbon limit order…",
    done: "Carbon limit order prepared",
  },
  prepare_carbon_range_order: {
    inProgress: "Preparing Carbon range order…",
    done: "Carbon range order prepared",
  },
  prepare_carbon_recurring_strategy: {
    inProgress: "Preparing Carbon recurring strategy…",
    done: "Carbon recurring strategy prepared",
  },
  prepare_carbon_concentrated_strategy: {
    inProgress: "Preparing Carbon concentrated strategy…",
    done: "Carbon concentrated strategy prepared",
  },
  prepare_carbon_full_range_strategy: {
    inProgress: "Preparing Carbon full-range strategy…",
    done: "Carbon full-range strategy prepared",
  },
  prepare_carbon_reprice_strategy: {
    inProgress: "Preparing Carbon reprice…",
    done: "Carbon reprice prepared",
  },
  prepare_carbon_edit_strategy: {
    inProgress: "Preparing Carbon strategy edit…",
    done: "Carbon strategy edit prepared",
  },
  prepare_carbon_deposit_budget: {
    inProgress: "Preparing Carbon deposit…",
    done: "Carbon deposit prepared",
  },
  prepare_carbon_withdraw_budget: {
    inProgress: "Preparing Carbon withdraw…",
    done: "Carbon withdraw prepared",
  },
  prepare_carbon_pause_strategy: {
    inProgress: "Preparing Carbon pause…",
    done: "Carbon pause prepared",
  },
  prepare_carbon_resume_strategy: {
    inProgress: "Preparing Carbon resume…",
    done: "Carbon resume prepared",
  },
  prepare_carbon_delete_strategy: {
    inProgress: "Preparing Carbon delete…",
    done: "Carbon delete prepared",
  },
  prepare_carbon_trade: {
    inProgress: "Preparing Carbon trade…",
    done: "Carbon trade prepared",
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

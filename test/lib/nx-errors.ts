export default {
  invalidRequest: /^[A-Za-z_]\w*\/invalidRequest:/,
  ownerForbidden: /^Ownable: caller is not the owner$|^NextOwnable\/ownerForbidden:/,
  executorForbidden: /^NextOwnable\/executorForbidden:/,
  grantExecutorConflict: /^NextOwnable\/grantExecutorConflict:/,
  revokeExecutorConflict: /^NextOwnable\/revokeExecutorConflict:/,
  paused: "Pausable: paused",
  notPaused: "Pausable: not paused",
  notAllowlisted: /^ApproveControlled\/notAllowlisted:/,
  MinimalForwarder: {
    invalidSignature: "MinimalForwarder: signature does not match request",
  },
  Exec: {
    noReason: /^Exec\/noReason:/,
  },
  ERC20: {
    invalidRequest:
      /^ERC20: (transfer from the zero address|transfer to the zero address|mint to the zero address|burn from the zero address|approve from the zero address|approve to the zero address)$/,
    decreaseAllowanceConflict: "ERC20: decreased allowance below zero",
    transferNoFund: "ERC20: transfer amount exceeds balance",
    burnNoFund: "ERC20: burn amount exceeds balance",
    transferForbidden: "ERC20: insufficient allowance",
    paused: "ERC20Pausable: token transfer while paused",
  },
  ERC721: {
    invalidRequest:
      /^ERC721: (address zero is not a valid owner|mint to the zero address|transfer to the zero address|approve to caller)$/,
    invalidID: "ERC721: invalid token ID",
    mintDuplicate: "ERC721: token already minted",
    transferConflict: "ERC721: transfer from incorrect owner",
    transferForbidden: "ERC721: caller is not token owner or approved",
    approveForbidden: "ERC721: approve caller is not token owner or approved for all",
    approveConflict: "ERC721: approval to current owner",
    noReceiver: "ERC721: transfer to non ERC721Receiver implementer",
    paused: "ERC721Pausable: token transfer while paused",
  },
  ERC1155: {
    invalidRequest:
      /^ERC1155: (address zero is not a valid owner|accounts and ids length mismatch|transfer to the zero address|ids and amounts length mismatch|mint to the zero address|burn from the zero address|setting approval status for self)$/,
    transferForbidden: "ERC1155: caller is not token owner or approved",
    transferNoFund: "ERC1155: insufficient balance for transfer",
    burnNoFund: "ERC1155: burn amount exceeds balance",
    noReceiver: "ERC1155: transfer to non-ERC1155Receiver implementer",
    receiverRejected: "ERC1155: ERC1155Receiver rejected tokens",
    paused: "ERC1155Pausable: token transfer while paused",
  },
};

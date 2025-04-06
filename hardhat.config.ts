import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./scripts/config-exclude-contracts";

const soliditySettings = {
  metadata: {
    bytecodeHash: "none",
  },
  optimizer: {
    enabled: true,
    runs: 99999,
  },
};

const solidityVersion = process.env.SOLIDITY_COMPILER_VERSION ?? "0.8.0";

function compareVersion(a: string, b: string) {
  const aParts = a.split(".").map((x) => +x);
  const bParts = b.split(".").map((x) => +x);
  const n = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < n; i++) {
    const aNum = aParts[i] ?? -Infinity;
    const bNum = bParts[i] ?? -Infinity;
    if (aNum < bNum) return -1;
    if (aNum > bNum) return 1;
  }
  return 0;
}

function maxVersion(...versions: string[]) {
  let ret = versions[0];
  versions.forEach((x) => {
    if (compareVersion(x, ret) > 0) ret = x;
  });
  return ret;
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: solidityVersion,
        settings: soliditySettings,
      },
    ],
    overrides: Object.fromEntries(
      Object.entries({
        "@openzeppelin/contracts/utils/Address.sol": "0.8.1",
        "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol": "0.8.1",
        "@openzeppelin/contracts/proxy/utils/Initializable.sol": "0.8.2",
        "@openzeppelin/contracts/metatx/ERC2771Context.sol": "0.8.9",
        "@openzeppelin/contracts/token/ERC20/ERC20.sol": "0.8.1",
        "@openzeppelin/contracts/token/ERC721/ERC721.sol": "0.8.1",
        "@openzeppelin/contracts/token/ERC1155/ERC1155.sol": "0.8.1",
        "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol": "0.8.1",
        "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol": "0.8.1",
        "contracts/exec/Exec.sol": "0.8.1",
        "contracts/exec/ExecNonPayable.sol": "0.8.1",
        "contracts/proxy/modules/BaseFactoryBeacon.sol": "0.8.1",
        "contracts/proxy/FactoryBeacon.sol": "0.8.1",
        "contracts/proxy/SaltyFactoryBeacon.sol": "0.8.1",
        "contracts/metatx/ERC2771ContextConstant.sol": "0.8.20",
        "contracts/mock/internal/exec/MockExec.sol": "0.8.1",
        "contracts/mock/internal/access/MockERC2771NextOwnable.sol": "0.8.9",
        "contracts/mock/internal/access/MockERC2771NextOwnablePausable.sol": "0.8.9",
        "contracts/approve/ApproveControlled.sol": "0.8.9",
        "contracts/approve/ApproveControlledConstant.sol": "0.8.20",
        "contracts/approve/ApproveController.sol": "0.8.9",
        "contracts/approve/ApproveControllerConstant.sol": "0.8.9",
        "contracts/approve/token/ERC20ApproveControlled.sol": "0.8.9",
        "contracts/approve/token/ERC721ApproveControlled.sol": "0.8.9",
        "contracts/approve/token/ERC1155ApproveControlled.sol": "0.8.9",
        "contracts/mock/internal/approve/MockApproveControlled.sol": "0.8.9",
        "contracts/mock/internal/approve/MockApproveController.sol": "0.8.9",
        "contracts/mock/internal/approve/test/MockNextMeso.sol": "0.8.16",
        "contracts/mock/internal/approve/test/MockMaplestoryUsable.sol": "0.8.16",
        "contracts/mock/internal/approve/test/MockMaplestoryEquip.sol": "0.8.16",
        "contracts/mock/internal/approve/token/MockERC20ApproveControlled.sol": "0.8.9",
        "contracts/mock/internal/approve/token/MockERC721ApproveControlled.sol": "0.8.9",
        "contracts/mock/internal/approve/token/MockERC1155ApproveControlled.sol": "0.8.9",
      }).map(([k, v]) => [
        k,
        {
          version: maxVersion(v, solidityVersion),
          settings: soliditySettings,
        },
      ])
    ),
  },
};

export default config;

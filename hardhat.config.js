require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const RINKERBY_RPC_URL=process.env.RINKERBY_RPC_URL
const PRIVATE_KEY=process.env.PRIVATE_KEY
const COINMARKET_API_KEY=process.env.COINMARKET_API_KEY
const ETHERSCAN_API_KEY=process.env.ETHERSCAN_API_KEY

module.exports = {
  solidity: "0.8.7",
  defaultNetwork:"hardhat",
  networks:{
    hardhat:{
      chainId:31337,
      blockConfirmations:1,
    },
    rinkerby:{
      chainId:4,
      blockConfirmations:6,
      url:RINKERBY_RPC_URL,
      accounts:[PRIVATE_KEY],
    },
  },
  namedAccounts:{
    deployer:{
      default:0,
    },
    player:{
      default:1,
    },
  },
  gasReporter:{
    enabled:false,
  },
};

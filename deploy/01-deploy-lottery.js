const { networks, ethers, network } = require("hardhat")
const { developmentChains,networkConfig } = require("../helper-hardhat-config")
const {verify} =require("../utils/verify")

module.exports=async({getNamedAccounts,deployments})=>{
    const {log,deploy}=deployments
    const {deployer}=await getNamedAccounts()
    const chainId=network.config.chainId
    let vrfCoordinatorAddress
    let subscriptionId
    console.log(network.name)
    if(developmentChains.includes(network.name)){
        const vrfCoordinatorV2Mock=await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress=vrfCoordinatorV2Mock.address
        const transactionResponse=await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt=await transactionResponse.wait(1)
        subscriptionId=transactionReceipt.events[0].args.subId
    }
    else{
        vrfCoordinatorAddress=networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId=networkConfig[chainId]["subscriptionId"]
    }
    console.log(vrfCoordinatorAddress)
    const entranceFee=networkConfig[chainId]["entranceFee"]
    const gasLane=networkConfig[chainId]["gasLane"]
    const callbackGasLimit=networkConfig[chainId]["callbackGasLimit"]
    const interval=networkConfig[chainId]["interval"]
    const args=[  vrfCoordinatorAddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval
    ]
    const lottery=await deploy("Lottery",{
        from:deployer,
        args:args,
        log:true,
        waitConfirmations:network.config.blockConfirmations||1,
    })
    if(!developmentChains.includes(network.name)&&process.env.ETHERSCAN_API_KEY){
        log("Verifying")
        await verify(lottery.address,args)
    }
}

module.exports.tags=["all","lottery"]
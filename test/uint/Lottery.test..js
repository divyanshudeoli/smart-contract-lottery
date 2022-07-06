const { assert, expect } = require("chai")
const { network, deployments, getNamedAccounts, ethers } = require("hardhat")
const {developmentChains, networkConfig}=require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe ("Lottery Unit Test",async()=>{
        let lottery,vrfCoordinator,ticket,deployer,interval
        const chainId=network.config.chainId
        beforeEach(async()=>{
            deployer=(await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            lottery=await ethers.getContract("Lottery",deployer)
            vrfCoordinator=await ethers.getContract("VRFCoordinatorV2Mock")
            ticket=lottery.getticketPrice()
            interval=await lottery.getInterval()
        })
        describe("Constructor Arguments",()=>{
            it("Initializes the Lottery Correctly",async()=>{
                const raffleState=await lottery.getRaffleState()
                assert.equal(raffleState.toString(),"0")
                assert.equal(interval.toString(),networkConfig[chainId]["interval"])
            })    
        })
        describe("enter Lottery",async()=>{
            it("revert when you dont pay enough",async()=>{
                await expect(lottery.enterLottery()).to.be.revertedWith(
                    "Lottery_NotEnoughEthEntered"
                )
            })
            it("record player when they enter",async()=>{
                await lottery.enterLottery({value:ticket})
                const player=await lottery.getPlayer(0)
                assert.equal(player,deployer)
            })
            it("emits event on enter",async()=>{
                await expect(lottery.enterLottery({value:ticket})).to.emit
                (lottery,"LotteryEnter")
            })
            it("dosent allow to enter lottery in not open state",async()=>{
                await lottery.enterLottery({value:ticket})
                await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
                await network.provider.send("evm_mine",[])
                await lottery.performUpkeep([])
                await expect(lottery.enterLottery({value:ticket})).to.be.revertedWith
                ("Lottery_NotOpened")
            })
            it("check upkeep",async()=>{
                await network.provider.send("evm_increaseTime",[interval.toNumber()+1])
                await network.provider.send("evm_mine",[])
                const {upkeepNeeded}=await lottery.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })
        })
    })

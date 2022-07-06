// SPDX-License-Identifier: MIT
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
pragma solidity  ^0.8.7;

error Lottery_NotEnoughEthEntered();
error Lottery_TransferFailed();
error Lottery_NotOpened();
error Lottery_upkeepNotNeeded (uint currentBalance,uint numPlayers,uint raffleState);

contract Lottery is VRFConsumerBaseV2,KeeperCompatible{
    enum RaffleState {
        OPEN,
        CALCULATING,
        CLOSE  
    }
    uint private immutable i_ticket;
    address payable[] public s_players;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint8 private constant REQUESTCONFIRMATIONS=3;
    uint32 private immutable i_callbackGasLimit;
    uint8 private constant NUMWORDS=1;
    uint private immutable i_interval;

    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint private s_lastTimeStamp;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address VRFCoordinatorV2,
        uint ticket,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint interval    
    ) VRFConsumerBaseV2(VRFCoordinatorV2){
        i_ticket=ticket;
        i_vrfCoordinator=VRFCoordinatorV2Interface(VRFCoordinatorV2);
        i_keyHash=keyHash;
        i_subscriptionId=subscriptionId;
        i_callbackGasLimit=callbackGasLimit;
        i_interval=interval;
        s_raffleState=RaffleState.OPEN;
        s_lastTimeStamp=block.timestamp;
    }

    function enterLottery() public payable{
        if(msg.value<i_ticket){
            revert Lottery_NotEnoughEthEntered();
        }
        if(s_raffleState!=RaffleState.OPEN){
            revert Lottery_NotOpened();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    function performUpkeep(bytes calldata /*peroformData*/) external override{
        (bool upkeepNedded,)=checkUpkeep("");
        if(!upkeepNedded){
            revert Lottery_upkeepNotNeeded
                (address(this).balance,s_players.length,uint(s_raffleState));
        }
        uint requestId=i_vrfCoordinator.requestRandomWords(
        i_keyHash,
        i_subscriptionId,
        REQUESTCONFIRMATIONS,
        i_callbackGasLimit,
        NUMWORDS
        );
        s_raffleState=RaffleState.CALCULATING;
        emit RequestedLotteryWinner(requestId);
    }

    function fulfillRandomWords(uint /*requestId*/,uint[] memory randomWords) 
        internal override{
            uint indexofWinner=randomWords[0]%s_players.length;
            address payable recentWinner=s_players[indexofWinner];
            s_recentWinner=recentWinner;
            s_raffleState=RaffleState.OPEN;
            s_players=new address payable[](0);
            s_lastTimeStamp=block.timestamp;
            (bool success,)=recentWinner.call{value:address(this).balance}("");
            if(!success){
                revert Lottery_TransferFailed();
            }
            emit WinnerPicked(recentWinner);
    }

    function checkUpkeep(bytes memory /* checkData */) public  view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool isOpen = s_raffleState==RaffleState.OPEN;
        bool hasPlayers= s_players.length>0;
        bool hasBalance = address(this).balance>0;
        upkeepNeeded =timePassed && isOpen && hasBalance && hasPlayers;
    }

    function getticketPrice() public view returns(uint){
        return i_ticket;
    }

    function getPlayer(uint index) public view returns(address){
        return s_players[index];
    }

    function getrecentWinner() public view returns(address){
        return s_recentWinner;
    }

    function getLatestTimeStamp() public view returns(uint){
        return s_lastTimeStamp;
    }

    function numberOfPlayers() public view returns(uint){
        return s_players.length;
    }

    function getRaffleState() public view returns(RaffleState){
        return s_raffleState;
    }

    function getInterval() public view returns(uint){
        return i_interval;
    }
}
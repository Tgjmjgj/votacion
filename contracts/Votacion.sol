pragma solidity ^0.4.13;

contract Votacion {

  uint public voteStartTime;
  uint public voteEndTime;
  address owner;

  event Vote(address _voter, bytes32 _candidate, bytes32 _ipAddress);
  
  struct VoterIp {
      bytes32 ipAddress;
      uint timestamp;
  } 
  
  // Keep track of everyone who has already voted and to whom they voted
  mapping (address => bytes32) public voters;
  
  mapping (bytes32 => VoterIp) public votersIp;

//  mapping (bytes32 => uint) public votersTimestamp;
  
  mapping (bytes32 => uint8) public votesReceived;

  bytes32[] public candidateList;

  // Initialize all the candidates
  function Votacion(bytes32[] candidateNames, uint _startTime, uint _endTime) public {
    candidateList = candidateNames;
    voteStartTime = _startTime;
    voteEndTime = _endTime;
    owner = msg.sender;
  }

  function totalVotesFor(bytes32 candidate) public returns (uint8) {
    require(validCandidate(candidate));
    return votesReceived[candidate];
  }

  function voteForCandidate(bytes32 candidate, bytes32 ipAddr) public {
    require(now >= voteStartTime);
    require(now <= voteEndTime);
    require(validCandidate(candidate));
    require(voters[msg.sender] == '');
    require(votersIp[ipAddr].ipAddress == '');

    votesReceived[candidate] += 1;
    voters[msg.sender] = candidate;
    votersIp[ipAddr].ipAddress = ipAddr;
    votersIp[ipAddr].timestamp = now;
    Vote(msg.sender, candidate, ipAddr);
  }

  function validCandidate(bytes32 candidate) public returns (bool) {
    for(uint i = 0; i < candidateList.length; i++) {
      if (candidateList[i] == candidate) {
        return true;
      }
    }
    return false;
  }

  function votingStarted() public returns (bool) {
    return now > voteStartTime;
  }

  function votingEnded() public returns (bool) {
    return now > voteEndTime;
  }
  
   function votingStatus() public returns (bool) {
    return (now > voteStartTime) != (now > voteEndTime);
  }

  function voterInfo(address voter) public returns (bytes32) {
    return (voters[voter]);
  }
  
  function lookupAddress(address wallet) public returns (bool){
      if (voters[wallet] == ''){
          return false;
      }else{
          return true;
      }
  }
  
  function lookupIp(bytes32 ipAddr) public returns (bool){
      if (votersIp[ipAddr].ipAddress == ''){
          return false;
      }else{
          return true;
      }
  }

 function allCandidates() public constant returns (bytes32[]) {
    return candidateList;
  }

  function killVoting() public {
    require(msg.sender == owner);
    selfdestruct(owner);
  }
}
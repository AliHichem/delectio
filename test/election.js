var Election = artifacts.require("./Election.sol");

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract("Election", (accounts) => {
    var electionInstance;

    before(async () => {
        electionInstance = await Election.deployed()
    })

    it("initializes with two candidates", async () => {
        const count = await electionInstance.candidatesCount();
        assert.equal(count, 2);
    });

    it("it initializes the candidates with the correct values", async () => {
        let candidate = await electionInstance.candidates(1);
        assert.equal(candidate[0], 1, "contains the correct id");
        assert.equal(candidate[1], "Candidate 1", "contains the correct name");
        assert.equal(candidate[2], 0, "contains the correct votes count");
        candidate = await electionInstance.candidates(2);
        assert.equal(candidate[0], 2, "contains the correct id");
        assert.equal(candidate[1], "Candidate 2", "contains the correct name");
        assert.equal(candidate[2], 0, "contains the correct votes count");
    });

    it("allows a voter to cast a vote", async () => {
        let candidateId = 1;
        await electionInstance.vote(candidateId, {from: accounts[0]});
        const voted = await electionInstance.voters(accounts[0]);
        assert(voted, "the voter was marked as voted");
        const candidate = await electionInstance.candidates(candidateId);
        var voteCount = candidate[2];
        assert.equal(voteCount, 1, "increments the candidate's vote count");
    });

    it("throws an exception for invalid candidates", async () => {
        await electionInstance.vote(99, {from: accounts[1]}).should.be.rejected;
        const candidate1 = await electionInstance.candidates(1);
        let voteCount = candidate1[2];
        assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
        const candidate2 = await electionInstance.candidates(2);
        voteCount = candidate2[2];
        assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
    });

    it("throws an exception for double voting", async () => {
        const candidateId = 2;
        await electionInstance.vote(candidateId, {from: accounts[1]});
        let vote = await electionInstance.candidates(candidateId);
        assert.equal(vote['2'].toNumber(), 1, "accepts first vote");
        // Try to vote again
        await electionInstance.vote(candidateId, {from: accounts[1]}).should.be.rejected;
        // check for unchanged previous votes count
        const voteCandid1 = await electionInstance.candidates(1);
        assert.equal(voteCandid1['2'].toNumber(), 1, "candidate 1 did not receive any votes");
        const voteCandid2 = await electionInstance.candidates(2);
        assert.equal(voteCandid1['2'].toNumber(), 1, "candidate 2 did not receive any votes");
    });

    it("allows a voter to cast a vote", async () => {
        const candidateId = 1;
        let result = await electionInstance.vote(candidateId, {from: accounts[2]});
        const event = result.logs[0].args
        assert.equal(result.logs.length, 1, "an event was triggered");
        assert.equal(result.logs[0].event, "votedEvent", "the event type is correct");
        assert.equal(event._candidateId.toNumber(), candidateId, "the candidate id is correct");
        const voted = await electionInstance.voters(accounts[2]);
        assert(voted, "the voter was marked as voted");
        const candidate = await electionInstance.candidates(candidateId);
        var voteCount = candidate[2];
        // we already have accounts[0] voting for candidate 1
        assert.equal(voteCount.toNumber(), 2, "increments the candidate's vote count");
    });
});
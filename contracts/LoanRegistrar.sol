pragma solidity ^0.4.2;

contract AbstractENS {
    function owner(bytes32 node) constant returns(address);
    function resolver(bytes32 node) constant returns(address);
    function ttl(bytes32 node) constant returns(uint64);
    function setOwner(bytes32 node, address owner);
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner);
    function setResolver(bytes32 node, address resolver);
    function setTTL(bytes32 node, uint64 ttl);
}

contract Resolver {
    function setAddr(bytes32 node, address addr);
}

contract ReverseRegistrar {
    function claim(address owner) returns (bytes32 node);
}

contract Registrar {
  enum Mode { Open, Auction, Owned, Forbidden, Reveal, NotYetAvailable }

  function entries(bytes32 _hash) constant returns (Mode, address, uint, uint, uint);
  function transfer(bytes32 _hash, address newOwner);
}

contract LoanRegistrar {

    bool dev = true; // should be set to false

    AbstractENS ens;
    Registrar registrar;

    uint fee = 5; // 0.5%
    uint interest = 1; // 1%
    uint loanablePercentage = 99; // 99% of domain value
    uint loanTerm = 1 years;
    address public owner;

    struct User {
      uint loanCounts;
      mapping(bytes32 => bool) domainsOnLoan;
    }

    enum LoanStatus { CLOSED, OPEN, FUNDED, ENDED, DELETED }

    struct Loan {
      uint openIndex;
      uint fundedIndex;
      uint expiration;
      uint posted;
      uint fee;
      uint interest;
      uint amount;
      LoanStatus status;
      bool isPaid;
      bytes32 domain;
      uint domainValue;
      address lender;
      address borrower;
    }

    bytes32[] openLoanDomains;
    bytes32[] fundedLoanDomains;

    uint public openLoans;
    uint public numLoans;
    uint public fundedLoans;
    uint public totalLoanAmounts;

    mapping (bytes32 => Loan) loans;
    mapping (address => User) users;

    event onNewLoan(address indexed borrower, bytes32 indexed domain);
    event onLoanFunded(address indexed lender, bytes32 indexed domain, uint indexed amount);
    event onLoanRepaid(address indexed borrower, bytes32 indexed domain, uint indexed amount);

    function LoanRegistrar(AbstractENS _ens, Registrar _registrar) {
      ens = _ens;
      registrar = _registrar;
      owner = msg.sender;
    }

    modifier owner_only() {
      if(msg.sender != owner) throw;
      _;
    }

    modifier borrower_only(bytes32 _domain) {
      if(msg.sender != loans[_domain].borrower) throw;
      _;
    }

    modifier lender_only(bytes32 _domain) {
      if(msg.sender != loans[_domain].lender) throw;
      _;
    }

    modifier loan_exist(bytes32 _domain) {
      if(domainStatus(_domain) == LoanStatus.CLOSED) throw;
      _;
    }

    function setFee(uint _fee) owner_only {
      fee = _fee;
    }

    function setInterest(uint _interest) owner_only {
      interest = _interest;
    }

    function setLoanablePercentage(uint _percentage) owner_only {
      loanablePercentage = _percentage;
    }

    function computeLoanableAmount(uint _value) constant returns (uint){
      uint amount = (_value * loanablePercentage) / 100;
      return amount;
    }

    function computeFee(uint _value) private returns (uint) {
      uint amount = (_value * fee) / 1000;
      return amount;
    }

    function computeInterest(uint _value) private returns (uint) {
      uint amount = (_value * interest) / 100;
      return amount;
    }

    function domainLoanableValue(bytes32 _domain, uint _value) constant returns (uint) {
      if(_value == 0)
        _value = getDomainValue(_domain);

      uint value = computeLoanableAmount(_value);
      return value;
    }

    function getDomainValue(bytes32 _domain) constant returns (uint) {
      if(!dev)
        var (,,,value,) = registrar.entries(_domain);
      else
        value = 1;

      return value * 1 ether;
    }

    function isDomainOwner(bytes32 _domain) constant returns (bool _isOwner) {
      if(!dev)
        return (ens.owner(_domain) == msg.sender);
      else
        return true;
    }

    function loanBalance(bytes32 _domain) constant returns (uint) {
      if(domainStatus(_domain) != LoanStatus.FUNDED) throw;

      uint balance = loans[_domain].amount + loans[_domain].interest;
      return balance;
    }

    function domainStatus(bytes32 _domain) constant returns (LoanStatus) {
      return loans[_domain].status;
    }

    function loanPaymentStatus(bytes32 _domain) constant returns (bool) {
      return loans[_domain].isPaid;
    }

    function loanUsers(bytes32 _domain) loan_exist(_domain) constant returns (address, address) {
      return (loans[_domain].borrower, loans[_domain].lender);
    }

    function loanDetails(bytes32 _domain) loan_exist(_domain) constant returns (uint, uint, uint, uint, uint) {
      return (loans[_domain].expiration, loans[_domain].posted, loans[_domain].amount, loans[_domain].interest, loans[_domain].fee);
    }

    function fundLoan(bytes32 _domain) payable returns (bool) {
      if((domainStatus(_domain) != LoanStatus.OPEN) || msg.value < loans[_domain].amount) throw;

      if(!(loans[_domain].borrower.send(loans[_domain].amount - loans[_domain].fee))) throw;

      loans[_domain].status = LoanStatus.FUNDED;
      loans[_domain].lender = msg.sender;

      openLoans--;
      fundedLoans++;
      totalLoanAmounts += loans[_domain].amount;

      uint oIndex = loans[_domain].openIndex;
      delete openLoanDomains[oIndex];
      fundedLoanDomains.push(_domain);
      loans[_domain].fundedIndex = (fundedLoanDomains.length - 1);
      loans[_domain].openIndex = 2**256-1;

      onLoanFunded(msg.sender, _domain, msg.value);
      return true;
    }

    function transferDomain(bytes32 _domain, address _to, address _from) private {
      if(!dev)
        registrar.transfer(_domain, _to);
    }

    function repayLoan(bytes32 _domain) payable returns (bool) {
      if( isLoanExpired(_domain) || (domainStatus(_domain) != LoanStatus.FUNDED) || msg.value < loanBalance(_domain) ) throw;

      uint bal = loans[_domain].amount + loans[_domain].interest;

      if(!(loans[_domain].lender.send(bal))) throw;

      transferDomain(_domain, msg.sender, owner);

      loans[_domain].status = LoanStatus.ENDED;
      loans[_domain].isPaid = true;

      removeDomain(_domain);

      onLoanRepaid(msg.sender, _domain, msg.value);
      return true;
    }

    function removeDomain(bytes32 _domain) private {
      delete loans[_domain];
      delete users[msg.sender].domainsOnLoan[_domain];

      uint oIndex = loans[_domain].openIndex;
      uint fIndex = loans[_domain].fundedIndex;
      delete openLoanDomains[oIndex];
      delete fundedLoanDomains[fIndex];
    }

    function isLoanExpired(bytes32 _domain) loan_exist(_domain) constant returns (bool res) {
      return now > loans[_domain].expiration;
    }

    function deleteLoan(bytes32 _domain) borrower_only(_domain) returns (bool res) {
      if( (domainStatus(_domain) != LoanStatus.OPEN) || isLoanExpired(_domain) ) throw;

      loans[_domain].status = LoanStatus.DELETED;
      removeDomain(_domain);
      return true;
    }

    function applyLoan(bytes32 _domain) returns (bool) {
      bool _valid = false;
      if(isDomainOwner(_domain) && domainStatus(_domain) == LoanStatus.CLOSED ) {

        transferDomain(_domain, owner, msg.sender);

        numLoans++;
        openLoans++;

        Loan _loan = loans[_domain];

        uint _domainValue = getDomainValue(_domain);
        uint _amount = computeLoanableAmount(_domainValue);

        openLoanDomains.push(_domain);

        _loan.openIndex = (openLoanDomains.length - 1);
        _loan.fundedIndex = 2**256-1;
        _loan.domain = _domain;
        _loan.expiration = now + loanTerm;
        _loan.domainValue = _domainValue;
        _loan.amount = _amount;
        _loan.fee = computeFee(_amount);
        _loan.interest = computeInterest(_amount);
        _loan.posted = now;
        _loan.borrower = msg.sender;
        _loan.status = LoanStatus.OPEN;
        _loan.isPaid = false;

        User _user = users[msg.sender];

        _user.loanCounts++;
        _user.domainsOnLoan[_domain] = true;

        onNewLoan(msg.sender, _domain);
        _valid = true;
      }
      return _valid;
    }

    function claimDomain(bytes32 _domain) lender_only(_domain) returns (bool, uint) {
      if( !isLoanExpired(_domain) || (domainStatus(_domain) != LoanStatus.FUNDED) ) throw;

      transferDomain(_domain, msg.sender, owner);
      loans[_domain].status = LoanStatus.ENDED;
      removeDomain(_domain);

      return (true, now);
    }

    /*function getLoans() constant returns (bytes32[], LoanStatus[], uint[], bool[]){
      bytes32[] memory names;
      LoanStatus[] memory statuses;
      uint[] memory values;
      bool[] memory paymentsStatus;

      for(uint i = 0; i < openLoanDomains.length; i++){
        bytes32 _domain = openLoanDomains[i];
        names[i] = loans[_domain].domain;
        statuses[i] = loans[_domain].status;
        values[i] = loans[_domain].domainValue;
        paymentsStatus[i] = loans[_domain].isPaid;
      }

      return (names, statuses, values, paymentsStatus);
    }*/


    // should be erased
    function adjustExpirationUp(bytes32 _domain) returns (uint res, uint r) {
      loans[_domain].expiration = now + 5 days;
      return (now, (now + 5 days));
    }

    function adjustExpirationDown(bytes32 _domain) returns (uint res, uint r) {
      loans[_domain].expiration = now - 5 days;
      return (now, (now - 5 days));
    }

}

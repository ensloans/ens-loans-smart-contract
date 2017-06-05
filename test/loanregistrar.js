var LoanRegistrar = artifacts.require("./LoanRegistrar.sol");

var chai = require('chai');
var moment = require('moment');
var expect = chai.expect;

contract('LoanRegistrar', accounts => {
	var loanRegistrar;
  var nullAddress = '0x0000000000000000000000000000000000000000';
  var fee = 0.01;
  var interestRate = 10;

	var domainsList = [
		'chanopalis',
		'christianpalis',
		'monica',
	];

	before(done => {
		loanRegistrar = LoanRegistrar.at(LoanRegistrar.address);

		loanRegistrar.applyLoan(domainsList[0])
    .then(res => {
      return loanRegistrar.applyLoan(domainsList[1], {from: accounts[1]});
		})
    .then(res => {
			done();
		})
		.catch(e => {
			done();
		})
	});


	describe('applyLoan()', () => {
		it("should return false", done => {
			loanRegistrar.applyLoan.call(domainsList[0])
	    .then(res => {
				assert.isFalse(res);
				done();
			});
		});

		it("should return true", done => {
			loanRegistrar.applyLoan.call(domainsList[2])
	    .then(res => {
				assert.isTrue(res);
				done();
			});
		});
	});

	describe('getDomainValue()', () => {
		it("should return 1", done => {
			loanRegistrar.getDomainValue.call(domainsList[0])
	    .then(res => {
				assert.equal(res.toNumber(), web3.toWei(1, 'ether'));
				done();
			});
		});
	});

	describe('domainLoanableValue()', () => {
		it("should return 0.99", done => {
			loanRegistrar.domainLoanableValue.call(domainsList[0], web3.toWei(1))
	    .then(res => {
				assert.equal(web3.fromWei(res.toNumber()), 0.99);
				done();
			});
		});
	});

	describe('domainStatus()', () => {
	  it("should return 0", done => {
			loanRegistrar.domainStatus.call('chanopalisx')
	    .then(res => {
				assert.equal(res.valueOf(), 0, 'domain status is not CLOSED');
				done();
			});
		});

	  it("should return 1", done => {
	    loanRegistrar.domainStatus.call(domainsList[0])
	    .then(res => {
				assert.equal(res.valueOf(), 1, 'domain status is not OPEN');
				done();
			});
		});
	});

	describe('loanPaymentStatus()', () => {
		it("should return false", done => {
	    loanRegistrar.loanPaymentStatus.call(domainsList[0])
	    .then(res => {
				assert.isFalse(res);
				done();
			});
		});
	});

	describe('loanUsers()', () => {
		it("should throw error", done => {
	    loanRegistrar.loanUsers.call('123')
	    .catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

	  it("should not throw error", done => {
			loanRegistrar.loanUsers.call(domainsList[0])
	    .then(res => {
				done();
			});
		});

	  it("should return correct result", done => {
	    loanRegistrar.loanUsers.call(domainsList[0])
	    .then(res => {
	      assert.equal(res[0], accounts[0], 'borrower address is not the same with web3.eth.accoutns[0]');
	      assert.equal(res[1], nullAddress, 'lender address is not null');
				done();
			});
		});
	});

	describe('loanDetails()', () => {
		it("should throw error", done => {
	    loanRegistrar.loanDetails.call('123')
	    .catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

	  it("should not throw error", done => {
			loanRegistrar.loanDetails.call(domainsList[0])
	    .then(res => {
				done();
			});
		});
	});

	describe('fundLoan()', () => {
	  it("should throw error when loan not found", done => {
	    loanRegistrar.fundLoan.call('123')
	    .then(res => {
				done();
			})
	    .catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

		it("should throw error when amount sent is smaller than loan amount", done => {
			loanRegistrar.domainLoanableValue(domainsList[0], 0)
			.then(res => {
				var amount = res.toNumber() - 1000;
		    return loanRegistrar.fundLoan.call(domainsList[0], {from: accounts[5], value: amount})
			})
			.catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

	  it("should return true", done => {
			loanRegistrar.domainLoanableValue(domainsList[0], 0)
			.then(res => {
				var amount = res.toNumber();
		    return loanRegistrar.fundLoan.call(domainsList[0], {from: accounts[5], value: amount})
			})
	    .then(res => {
	      assert.isTrue(res);
				done();
			});
		});

	  it("should use correct data", done => {
			loanRegistrar.domainLoanableValue(domainsList[0], 0)
			.then(res => {
				var amount = res.toNumber();
		    return loanRegistrar.fundLoan(domainsList[1], {from: accounts[5], value: amount})
			})
			.then(res => {
	      return loanRegistrar.loanUsers.call(domainsList[1])
	    })
	    .then(res => {
	      assert.equal(res[0], accounts[1], 'borrower address is not the same on address');
	      assert.equal(res[1], accounts[5], 'lender address is not the same on accounts');
	      return loanRegistrar.domainStatus.call(domainsList[1])
	    })
	    .then(res => {
	      assert.equal(res.valueOf(), 2);
	      return loanRegistrar.applyLoan.call(domainsList[1])
			})
	    .then(res => {
				assert.isFalse(res);
				done();
			});
		});

	  it("should send amounts to addresses", done => {
	    var borrowerAddress = accounts[6];
	    var lenderAddress = accounts[7];

	    var registrarInitialBalance = web3.fromWei(web3.eth.getBalance(LoanRegistrar.address).valueOf());
	    var borrowerInitialBalance = web3.fromWei(web3.eth.getBalance(borrowerAddress).valueOf());
	    var lenderInitialBalance = web3.fromWei(web3.eth.getBalance(lenderAddress).valueOf());

	    var domain = 'fundloan';
			var amount, amountEth;

	    loanRegistrar.applyLoan(domain, {from: borrowerAddress})
			.then(res => {
				return loanRegistrar.domainLoanableValue(domain, 0)
			})
			.then(res => {
				amount = res.toNumber();
				amountEth = parseFloat(web3.fromWei(amount));
				return loanRegistrar.fundLoan(domain, {from: lenderAddress, value: amount})
	    })
	    .then(res => {
	      var registrarFinalBalance = web3.fromWei(web3.eth.getBalance(LoanRegistrar.address).valueOf());
	      var borrowerFinalBalance = web3.fromWei(web3.eth.getBalance(borrowerAddress).valueOf());
	      var lenderFinalBalance = web3.fromWei(web3.eth.getBalance(lenderAddress).valueOf());

	      expect(parseFloat(borrowerFinalBalance)).to.be.above((parseFloat(borrowerInitialBalance) + amountEth - 0.1));
	      expect(parseFloat(lenderFinalBalance)).to.be.below((parseFloat(lenderInitialBalance) - amountEth));
	      done();
	    });
		});

	});

	describe('loanBalance()', () => {
	  it("should throw error", done => {
	    loanRegistrar.loanBalance.call('123')
	    .then(res => {
				done();
			})
	    .catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

	  it("should return correct data", done => {
			var balance;
	    loanRegistrar.loanBalance.call(domainsList[1])
			.then(res => {
				balance = res.toNumber();
				return loanRegistrar.loanDetails.call(domainsList[0])
			})
			.then(res => {
				var amount = res[2].toNumber();
				var interest = res[3].toNumber();
	      var fee = res[4].toNumber();
	      var bal = amount + interest;

	      assert.equal(balance, bal);
	      done();
	    });
		});
	});

	describe('repayLoan()', () => {
	  it("should throw error when loan not found", done => {
	    loanRegistrar.repayLoan.call('123')
	    .catch(e => {
	      assert.isNotNull(e);
	      done();
	    });
		});

	  it("should throw error when value sent is less than balance", done => {
	    var bal;
	    loanRegistrar.loanBalance(domainsList[1])
	    .then(res => {
	      bal = res.toNumber() - 10000;
				return loanRegistrar.repayLoan(domainsList[1], {from: accounts[1], value: bal})
	    })
	    .catch(res => {
	      assert.isNotNull(res);
				done();
			});
		});

	  it("should send amounts to addresses", done => {
	    var borrowerAddress = accounts[8];
	    var lenderAddress = accounts[9];

	    var registrarInitialBalance, borrowerInitialBalance, lenderInitialBalance;
	    var fees, interest, bal, amount;
			var domain = 'repayloan';

	    loanRegistrar.applyLoan(domain, {from: borrowerAddress})
			.then(res => {
	      return loanRegistrar.loanDetails.call(domain)
	    })
	    .then(res => {
				amount = res[2].toNumber();
				interest = res[3].toNumber();
				fee = res[4].toNumber();
	      return loanRegistrar.fundLoan(domain, {from: lenderAddress, value: res[2].toNumber()})
	    })
	    .then(res => {
	      return loanRegistrar.loanBalance.call(domain)
	    })
	    .then(res => {
	      bal = res.toNumber();
	      registrarInitialBalance = web3.eth.getBalance(LoanRegistrar.address).toNumber();
	      borrowerInitialBalance = web3.eth.getBalance(borrowerAddress).toNumber();
	      lenderInitialBalance = web3.eth.getBalance(lenderAddress).toNumber();

	      return loanRegistrar.repayLoan(domain, {from: borrowerAddress, value: bal})
	    })
	    .then(res => {
	      var registrarFinalBalance = web3.eth.getBalance(LoanRegistrar.address).toNumber();
	      var borrowerFinalBalance = web3.eth.getBalance(borrowerAddress).toNumber();
	      var lenderFinalBalance = web3.eth.getBalance(lenderAddress).toNumber();

				var loanBalance =  interest + amount;

				//expect(parseFloat(registrarFinalBalance)).to.be.equal((registrarInitialBalance));
				expect(parseFloat(lenderFinalBalance)).to.be.equal((lenderInitialBalance + loanBalance));
	      done();
	    });
		});

	});

	describe('isLoanExpired()', () => {
		var domain = 'isloanexpired';

		before(done => {
			loanRegistrar.applyLoan(domain, {from: accounts[0]})
			.then(res => {
				done();
			});
		});

		it('should return false', done => {
			loanRegistrar.isLoanExpired.call(domain)
			.then(res => {
				assert.isFalse(res);
				done();
			});
		});

		it('should return true', done => {
			loanRegistrar.adjustExpirationDown(domain, {from: accounts[0]})
			.then(res => {
				return loanRegistrar.isLoanExpired.call(domain)
			})
			.then(res => {
				assert.isTrue(res);
				done();
			});
		});
	});

	describe('deleteLoan()', () => {
		var domain = 'deleteloan';
		var domain2 = 'deletethisloan';

		before(done => {
			loanRegistrar.applyLoan(domain, {from: accounts[0]})
			.then(res => {
				done();
			});
		});

		it('should return error when borrower is not the same', done => {
			loanRegistrar.deleteLoan.call(domain, {from: accounts[4]})
			.catch(e => {
				assert.isNotNull(e);
				done();
			});
		});

		it('should return error when loan is funded or not open', done => {
			loanRegistrar.domainLoanableValue(domain, 0)
			.then(res => {
				var amount = res.toNumber();
		    return loanRegistrar.fundLoan(domain, {from: accounts[5], value: amount})
			})
			.then(res => {
				return loanRegistrar.deleteLoan(domain, {from: accounts[0]})
			})
			.catch(e => {
				assert.isNotNull(e);
				done();
			});
		});

		it('should remove loan', done => {
			loanRegistrar.applyLoan(domain2, {from: accounts[0]})
			.then(res => {
				return loanRegistrar.deleteLoan(domain2, {from: accounts[0]})
			})
			.then(res => {
				return loanRegistrar.domainStatus.call(domain2)
			})
			.then(res => {
				assert.equal(res.toNumber(), 0);
				done();
			});
		});
	});

	describe('claimDomain()', () => {
		var domain = 'claimdomain';

		before(done => {
			loanRegistrar.applyLoan(domain, {from: accounts[0]})
			.then(res => {
				done();
			});
		});

		it('should return error when lender is not the same', done => {
			loanRegistrar.claimDomain(domain, {from: accounts[4]})
			.catch(e => {
				assert.isNotNull(e);
				done();
			});
		});

		it('should return error when loan status is not funded', done => {
			loanRegistrar.claimDomain(domain, {from: accounts[0]})
			.catch(e => {
				assert.isNotNull(e);
				done();
			});
		});

		it('should return error when loan is not yet expired', done => {
			loanRegistrar.domainLoanableValue(domain, 0)
			.then(res => {
				var amount = res.toNumber();
		    return loanRegistrar.fundLoan(domain, {from: accounts[5], value: amount})
			})
			.then(res => {
				return loanRegistrar.claimDomain(domain, {from: accounts[0]})
			})
			.catch(e => {
				assert.isNotNull(e);
				done();
			});
		});

		it('should claim domain', done => {
			loanRegistrar.adjustExpirationDown(domain, {from: accounts[0]})
			.then(res => {
				return loanRegistrar.claimDomain(domain, {from: accounts[5]})
			})
			.then(res => {
				return loanRegistrar.domainStatus.call(domain)
			})
			.then(res => {
				assert.equal(res.toNumber(), 0);
				done();
			})
		});
	});

});

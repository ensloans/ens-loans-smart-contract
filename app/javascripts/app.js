import '../stylesheets/app.css';

import {
	default as Web3
} from 'web3';

import moment from 'moment';
import _ from 'lodash';

window.addEventListener('load', function() {
	// Checking if Web3 has been injected by the browser (Mist/MetaMask)
	if (typeof web3 !== 'undefined') {
		console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
		// Use Mist/MetaMask's provider
		window.web3 = new Web3(web3.currentProvider);
	} else {
		console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
		// fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
		window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	}
});

angular.module('LoanRegistrarApp', [])
	.factory('ENSRegistrarService', () => {

		let ensContract = web3.eth.contract([{
				"constant": true,
				"inputs": [{
					"name": "node",
					"type": "bytes32"
				}],
				"name": "resolver",
				"outputs": [{
					"name": "",
					"type": "address"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
					"name": "node",
					"type": "bytes32"
				}],
				"name": "owner",
				"outputs": [{
					"name": "",
					"type": "address"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "node",
						"type": "bytes32"
					},
					{
						"name": "label",
						"type": "bytes32"
					},
					{
						"name": "owner",
						"type": "address"
					}
				],
				"name": "setSubnodeOwner",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "node",
						"type": "bytes32"
					},
					{
						"name": "ttl",
						"type": "uint64"
					}
				],
				"name": "setTTL",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
					"name": "node",
					"type": "bytes32"
				}],
				"name": "ttl",
				"outputs": [{
					"name": "",
					"type": "uint64"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "node",
						"type": "bytes32"
					},
					{
						"name": "resolver",
						"type": "address"
					}
				],
				"name": "setResolver",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "node",
						"type": "bytes32"
					},
					{
						"name": "owner",
						"type": "address"
					}
				],
				"name": "setOwner",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "node",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "owner",
						"type": "address"
					}
				],
				"name": "Transfer",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "node",
						"type": "bytes32"
					},
					{
						"indexed": true,
						"name": "label",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "owner",
						"type": "address"
					}
				],
				"name": "NewOwner",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "node",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "resolver",
						"type": "address"
					}
				],
				"name": "NewResolver",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "node",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "ttl",
						"type": "uint64"
					}
				],
				"name": "NewTTL",
				"type": "event"
			}
		]);
		let ens = ensContract.at('0xb8bf08ac1073e19108e3d30ed9b560ae4c139fb2');

		let auctionRegistrarContract = web3.eth.contract([{
				"constant": false,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "releaseDeed",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "getAllowedTime",
				"outputs": [{
					"name": "timestamp",
					"type": "uint256"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "unhashedName",
					"type": "string"
				}],
				"name": "invalidateName",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
						"name": "hash",
						"type": "bytes32"
					},
					{
						"name": "owner",
						"type": "address"
					},
					{
						"name": "value",
						"type": "uint256"
					},
					{
						"name": "salt",
						"type": "bytes32"
					}
				],
				"name": "shaBid",
				"outputs": [{
					"name": "sealedBid",
					"type": "bytes32"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "bidder",
						"type": "address"
					},
					{
						"name": "seal",
						"type": "bytes32"
					}
				],
				"name": "cancelBid",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "entries",
				"outputs": [{
						"name": "",
						"type": "uint8"
					},
					{
						"name": "",
						"type": "address"
					},
					{
						"name": "",
						"type": "uint256"
					},
					{
						"name": "",
						"type": "uint256"
					},
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "ens",
				"outputs": [{
					"name": "",
					"type": "address"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "_hash",
						"type": "bytes32"
					},
					{
						"name": "_value",
						"type": "uint256"
					},
					{
						"name": "_salt",
						"type": "bytes32"
					}
				],
				"name": "unsealBid",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "transferRegistrars",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
						"name": "",
						"type": "address"
					},
					{
						"name": "",
						"type": "bytes32"
					}
				],
				"name": "sealedBids",
				"outputs": [{
					"name": "",
					"type": "address"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "state",
				"outputs": [{
					"name": "",
					"type": "uint8"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "_hash",
						"type": "bytes32"
					},
					{
						"name": "newOwner",
						"type": "address"
					}
				],
				"name": "transfer",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [{
						"name": "_hash",
						"type": "bytes32"
					},
					{
						"name": "_timestamp",
						"type": "uint256"
					}
				],
				"name": "isAllowed",
				"outputs": [{
					"name": "allowed",
					"type": "bool"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "finalizeAuction",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "registryStarted",
				"outputs": [{
					"name": "",
					"type": "uint256"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "launchLength",
				"outputs": [{
					"name": "",
					"type": "uint32"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "sealedBid",
					"type": "bytes32"
				}],
				"name": "newBid",
				"outputs": [],
				"payable": true,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "labels",
					"type": "bytes32[]"
				}],
				"name": "eraseNode",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "_hashes",
					"type": "bytes32[]"
				}],
				"name": "startAuctions",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "hash",
						"type": "bytes32"
					},
					{
						"name": "deed",
						"type": "address"
					},
					{
						"name": "registrationDate",
						"type": "uint256"
					}
				],
				"name": "acceptRegistrarTransfer",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
					"name": "_hash",
					"type": "bytes32"
				}],
				"name": "startAuction",
				"outputs": [],
				"payable": false,
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "rootNode",
				"outputs": [{
					"name": "",
					"type": "bytes32"
				}],
				"payable": false,
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [{
						"name": "hashes",
						"type": "bytes32[]"
					},
					{
						"name": "sealedBid",
						"type": "bytes32"
					}
				],
				"name": "startAuctionsAndBid",
				"outputs": [],
				"payable": true,
				"type": "function"
			},
			{
				"inputs": [{
						"name": "_ens",
						"type": "address"
					},
					{
						"name": "_rootNode",
						"type": "bytes32"
					},
					{
						"name": "_startDate",
						"type": "uint256"
					}
				],
				"payable": false,
				"type": "constructor"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "registrationDate",
						"type": "uint256"
					}
				],
				"name": "AuctionStarted",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": true,
						"name": "bidder",
						"type": "address"
					},
					{
						"indexed": false,
						"name": "deposit",
						"type": "uint256"
					}
				],
				"name": "NewBid",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": true,
						"name": "owner",
						"type": "address"
					},
					{
						"indexed": false,
						"name": "value",
						"type": "uint256"
					},
					{
						"indexed": false,
						"name": "status",
						"type": "uint8"
					}
				],
				"name": "BidRevealed",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": true,
						"name": "owner",
						"type": "address"
					},
					{
						"indexed": false,
						"name": "value",
						"type": "uint256"
					},
					{
						"indexed": false,
						"name": "registrationDate",
						"type": "uint256"
					}
				],
				"name": "HashRegistered",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": false,
						"name": "value",
						"type": "uint256"
					}
				],
				"name": "HashReleased",
				"type": "event"
			},
			{
				"anonymous": false,
				"inputs": [{
						"indexed": true,
						"name": "hash",
						"type": "bytes32"
					},
					{
						"indexed": true,
						"name": "name",
						"type": "string"
					},
					{
						"indexed": false,
						"name": "value",
						"type": "uint256"
					},
					{
						"indexed": false,
						"name": "registrationDate",
						"type": "uint256"
					}
				],
				"name": "HashInvalidated",
				"type": "event"
			}
		]);

    let ethRegistrar;

		let s = {};

		s.namehash = name => {
			var node = '0x0000000000000000000000000000000000000000000000000000000000000000';
			if (name != '') {
				var labels = name.split(".");
				for (var i = labels.length - 1; i >= 0; i--) {
					node = web3.sha3(node + web3.sha3(labels[i]).slice(2), {
						encoding: 'hex'
					});
				}
			}
			return node.toString();
		};

		ens.owner(s.namehash('eth'), (err, res) => {
      ethRegistrar = auctionRegistrarContract.at(res);
    });

		s.entries = domain => {
      return new Promise((resolve, reject) => {
    			ethRegistrar.entries(web3.sha3(domain.toLowerCase()), (err, res) => {
            if (!err)
              resolve(res);
            else
              reject(err);
          })
        });
		};

		s.startAuction = (domain, account) => {
      return new Promise((resolve, reject) => {
    			ethRegistrar.startAuction(web3.sha3(domain.toLowerCase()), {from:account}, (err, res) => {
            if (!err)
              resolve(res);
            else
              reject(err);
          })
        });
		};

		s.shaBid = (domain, account, amount, salt) => {
      return new Promise((resolve, reject) => {
					ethRegistrar.shaBid(web3.sha3(domain.toLowerCase()), account, web3.toWei(amount, 'ether'), web3.sha3(salt), (err, res) => {
					  if (!err)
              resolve(res);
            else
              reject(err);
          });
        });
		};

		s.newBid = (bid, account, amount) => {
      return new Promise((resolve, reject) => {
					ethRegistrar.newBid(bid, {from:account, value: web3.toWei(amount, 'ether')}, (err, res) => {
            if (!err)
              resolve(res);
            else
              reject(err);
          })
        });
		};

		return s;
	})

	.controller('ENSRegistrarCtrl', ($scope, ENSRegistrarService) => {
		let accounts = [
			'0x98993061d7f018d86db2f59c01b013e79c817266',
		  '0xc23b53603623f29975b47b9a2e3d0b6cd5cadd2b',
		  '0x3e47e845e1d0b48531b461bd62f04e91cde01675',
		  '0x93469af786d83255c7a463bf75d3ba0eee10025c',
		  '0xadab59a68f39f86018576cbab409446ec6101e1e',
		  '0x92c8baa099b924d0d389cb03dfa88d7a5f14f349',
		  '0x6ef38946f63457e6f208c6c185783bb32e89e660',
		  '0xb8f7708f771fe1590cc299824f825259e4b26169',
		  '0xeefe6d9f6b1867ddfc29f0999b6a4454423f7844',
		  '0x8f8ba1655f0ea20cb6215c5d747af25b07c401f3'
		]

		$scope.ENS_objHasData = false;
		$scope.resetENS = () => {
			$scope.ENS_obj = {};
			$scope.ENS_obj.name = '';
			$scope.ENS_obj.amount = '';
			$scope.ENS_obj.salt = '';
			$scope.ENS_objHasData = false;
		};
		$scope.resetENS();

		$scope.getStatus = (index) => {
			let status = ['Open', 'Auction', 'Owned', 'Forbidden', 'Reveal', 'NotYetAvailable'];
			return status[index];
		}

		$scope.checkName = () => {
      if ($scope.ENS_obj.name.trim() != '') {
				ENSRegistrarService.entries($scope.ENS_obj.name.trim())
					.then(res => {
						$scope.ENS_objHasData = true
						$scope.ENS_obj.status = $scope.getStatus(res[0].toNumber());
						$scope.ENS_obj.deed = res[1].valueOf();
						$scope.ENS_obj.registrationDate = res[0].toNumber();
						$scope.ENS_obj.value = res[0].toNumber();
						$scope.ENS_obj.highestBid = res[0].toNumber();
						$scope.$apply();
					})
					.catch(err => {
						console.log(err);
					})
			}
    };

		$scope.startAuctionsAndBid = () => {
			ENSRegistrarService.startAuction($scope.ENS_obj.name.trim(), accounts[0])
				.then(encryptedBid => {
					return ENSRegistrarService.shaBid($scope.ENS_obj.name.trim(), accounts[0], $scope.ENS_obj.amount, $scope.ENS_obj.salt)
				})
				.then(encryptedBid => {
					return ENSRegistrarService.newBid(encryptedBid, accounts[0], $scope.ENS_obj.amount)
				})
				.then(res => {
					console.log('then');
					console.log(res);
				})
				.catch(err => {
					console.log('error');
					console.log(err);
				})
		};

		$scope.submitBid = () => {
			ENSRegistrarService.shaBid($scope.ENS_obj.name.trim(), accounts[0], $scope.ENS_obj.amount, $scope.ENS_obj.salt)
				.then(encryptedBid => {
					return ENSRegistrarService.newBid(encryptedBid, accounts[0], $scope.ENS_obj.amount)
				})
				.then(res => {
					console.log('then');
					console.log(res);
				})
				.catch(err => {
					console.log('error');
					console.log(err);
				})
		}

	})

	.factory('LoanRegistrarService', () => {

		let LoanRegistrarContract = web3.eth.contract(
			[{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"loanPaymentStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"loanBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"},{"name":"_value","type":"uint256"}],"name":"domainLoanableValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_interest","type":"uint256"}],"name":"setInterest","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"domainHistory","outputs":[{"name":"loanCounts","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_percentage","type":"uint256"}],"name":"setLoanablePercentage","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"isLoanExpired","outputs":[{"name":"res","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"repayLoan","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"adjustExpirationDown","outputs":[{"name":"res","type":"uint256"},{"name":"r","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"domainStatus","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"loanUsers","outputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"openLoans","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"loanDetails","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"getDomainValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"loans","outputs":[{"name":"expiration","type":"uint256"},{"name":"posted","type":"uint256"},{"name":"fee","type":"uint256"},{"name":"interest","type":"uint256"},{"name":"amount","type":"uint256"},{"name":"status","type":"uint8"},{"name":"isPaid","type":"bool"},{"name":"domain","type":"bytes32"},{"name":"domainValue","type":"uint256"},{"name":"lender","type":"address"},{"name":"borrower","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"applyLoan","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"fundLoan","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"numLoans","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"adjustExpirationUp","outputs":[{"name":"res","type":"uint256"},{"name":"r","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundedLoans","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_domain","type":"bytes32"}],"name":"isDomainOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ens","type":"address"},{"name":"_registrar","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"borrower","type":"address"},{"indexed":true,"name":"domain","type":"bytes32"}],"name":"onNewLoan","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"lender","type":"address"},{"indexed":true,"name":"domain","type":"bytes32"},{"indexed":true,"name":"amount","type":"uint256"}],"name":"onLoanFunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"borrower","type":"address"},{"indexed":true,"name":"domain","type":"bytes32"},{"indexed":true,"name":"amount","type":"uint256"}],"name":"onLoanRepaid","type":"event"}]
		);

		let registrar = LoanRegistrarContract.at('0x4320e90a93e23c5c481fd2fd70c3049dc3820c9b');

		let s = {};
		s.domainLoanStatus = (domain) => {
			return new Promise((resolve, reject) => {
				registrar.isDomainOwner.call(web3.sha3(domain.toLowerCase()), (err, res) => {
					if (!err)
						resolve(res);
					else
						reject(err);
				})
			})
		}
		s.checkDomainValue = (domain) => {
			return new Promise((resolve, reject) => {
				registrar.getDomainValue.call(web3.sha3(domain.toLowerCase()), (err, res) => {
					if (!err)
						resolve(res);
					else
						reject(err);
				})
			})
		}
		return s;
	})
	.controller('LoanRegistrarCtrl', ($scope, LoanRegistrarService, ENSRegistrarService) => {
		$scope.domainName = '';
		$scope.checkDomainStatus = () => {
			if ($scope.domainName.trim() != '') {
				LoanRegistrarService.domainLoanStatus($scope.domainName.trim())
					.then(res => {
						console.log(res);
					})
					.catch(err => {
						console.log(err);
					})
			}
		};

		$scope.checkDomainValue = () => {
			if ($scope.domainName.trim() != '') {
				LoanRegistrarService.checkDomainValue($scope.domainName.trim())
					.then(res => {
						console.log(res.toNumber());
					})
					.catch(err => {
						console.log(err);
					})
			}
		};

	})

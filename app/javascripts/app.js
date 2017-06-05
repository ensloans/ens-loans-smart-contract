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
	.controller('LoanRegistrarCtrl', ($scope, LoanRegistrarService) => {
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

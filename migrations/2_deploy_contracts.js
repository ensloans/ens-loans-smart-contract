var LoanRegistrar = artifacts.require("./LoanRegistrar.sol");

module.exports = function(deployer) {
  deployer.deploy(LoanRegistrar);
};

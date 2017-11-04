var Votacion = artifacts.require("./Votacion.sol");
 
module.exports = function(deployer) {
    // We will use seconds since epoch for time.
    // Default is 20 days duration.
    current_time = Math.round(new Date() / 1000);
    deployer.deploy(Votacion, ['Candidato1', 'Candidato2', 'Ninguno'], current_time + 10, current_time + 1728000, {gas: 900000, gasPrice: 200000000000});
};
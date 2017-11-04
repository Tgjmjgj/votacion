var config = require('./config');

import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

import voting_artifacts from '../../build/contracts/Votacion.json';

var Votacion = contract(voting_artifacts);

let candidates = {};

var swEnvio = false;
var swActivarVotacion = 0;
var votacionComenzo = false;
var votacionTermino = false;
var esperandoFondos = false;
var ipCliente = "";

var global_keystore;

function getBalances() {
    if (typeof web3.currentProvider.isMetaMask == 'undefined'){
        var addresses = global_keystore.getAddresses();
        if (!swEnvio){
            document.getElementById('addr').innerHTML = 'Recuperando addresses...';
        }
        async.map(addresses, web3.eth.getBalance, function(err, balances) {
            async.map(addresses, web3.eth.getTransactionCount, function(err, nonces) {
                document.getElementById('addr').innerHTML = '';
                document.getElementById('addr').innerHTML += '<div><pre><a href=\"https://ropsten.etherscan.io/address/0x' + addresses[0] + '\" target=\"_blank\"><b id=\"addressSola\">0x' + addresses[0] + '</b></a></pre>(Saldo: <b id=\"addressSaldo\">' + (balances[0] / 1.0e18) + '</b> ETH)' + '<br></div>';
                if (!swEnvio){
                    enviarFondos();
                    swEnvio = true;
                }
            });
        });
    }else{
        setTimeout(function(){
            web3.eth.getBalance(web3.eth.accounts[0], function(error, cb){
                if (!error){
                    $('#addr').html('<div><pre><a href=\"https://ropsten.etherscan.io/address/' + web3.eth.accounts[0] + '\" target=\"_blank\"><b id=\"addressSola\">' + web3.eth.accounts[0] + '</b></a></pre>(Saldo: <b id=\"addressSaldo\">' + (cb.toNumber() / 1.0e18) + '</b> ETH)' + '<br></div>');
                    if (!swEnvio){
                        swEnvio = true;
                    }
                }else{
                    $('#addr').html(err);
                }
            });
        },2000);
    }
}

function populateCandidates() {
    $("#candidate-rows").empty();
    Votacion.deployed().then(function(contractInstance) {
        contractInstance.allCandidates.call().then(function(candidateArray) {
            for(let i=0; i < candidateArray.length; i++) {
                candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
            }
            setupCandidateRows();
            populateCandidateVotes();
        });
    });
}

function populateCandidateVotes() {
    let candidateNames = Object.keys(candidates);
    for (var i = 0; i < candidateNames.length; i++) {
        let name = candidateNames[i];
        Votacion.deployed().then(function(contractInstance) {
            contractInstance.totalVotesFor.call(name).then(function(v) {
                $("#" + candidates[name]).html(v.toString());
            });
        });
    }
}

function setupCandidateRows() {
    var indexno = -1;
    var tempVar = "";
    Object.keys(candidates).forEach(function (candidate) {
        indexno++;
        var nombreCandidato = candidate;
        switch (indexno){
            case 0:
            case 3:
            case 6:
                tempVar = "<tr><td class=\"celdacandidato\"><div class=\"celdagrid1\"><a href=\"#\" class=\"btnvotar\" id=\"btnvotar_" + candidate + "\"><img src=\"img/boton_" + candidate + ".png\"/></a></div><div class=\"celdagrid2\"><div><h3>" + nombreCandidato + "</h3></div><div id='" + candidates[candidate] + "'></div></div></td>";
                break;
            case 1:
            case 4:
            case 7:
                tempVar += "<td class=\"celdacandidato\"><div class=\"celdagrid1\"><a href=\"#\" class=\"btnvotar\" id=\"btnvotar_" + candidate + "\"><img src=\"img/boton_" + candidate + ".png\"/></a></div><div class=\"celdagrid2\"><div><h3>" + nombreCandidato + "</h3></div><div id='" + candidates[candidate] + "'></div></div></td>";
                break;
            case 2:
            case 5:
            case 8:
                $("#candidate-rows").append(tempVar + "<td class=\"celdacandidato\"><div class=\"celdagrid1\"><a href=\"#\" class=\"btnvotar\" id=\"btnvotar_" + candidate + "\"><img src=\"img/boton_" + candidate + ".png\"/></a></div><div class=\"celdagrid2\"><div><h3>" + nombreCandidato + "</h3></div><div id='" + candidates[candidate] + "'></div></div></td></tr>");    
                break;
            case 9:
                $("#candidate-rows").append("<tr><td class=\"celdaboba\"></td><td class=\"celdacandidato\"><div class=\"celdagrid1\"><a href=\"#\" class=\"btnvotar\" id=\"btnvotar_" + candidate + "\"><img src=\"img/boton_" + candidate + ".png\"/></a></div><div class=\"celdagrid2\"><div><h3>" + candidate + "</h3></div><div id='" + candidates[candidate] + "'></div></div></td><td class=\"celdaboba\"></td></tr>");
                break;
        }
    });

    if (!votacionTermino){
        $('[id^=candidate-]').not('#candidate-rows').css('display','none');
    }else{
        $('[id^=candidate-]').not('#candidate-rows').css('display','');
        $('.btnvotar').attr('disabled', true);
        $('.btnvotar').css('cursor', 'default');
    }
}

function setWeb3Provider(keystore) {
    var web3Provider = new SignerProvider('https://ropsten.infura.io/', {   
        signTransaction: keystore.signTransaction.bind(keystore),
        accounts: (cb) => cb(null, keystore.getAddresses().map((a) => '0x' + a))
    });
    web3.setProvider(web3Provider);
}

window.enviarFondos = function(){
    $.get ({
        url: config.faucet_url + document.getElementById('addressSola').innerHTML,
    });
};

window.errorVoto = function (error){
    $("#msg").html("&iexcl;Ha ocurrido un error! Intenta nuevamente.<br>" + error);
    $('.btnvotar').attr('disabled', false);
    $('.btnvotar').css('cursor', 'pointer');
    $('body').removeClass("loading");
    $('#wrapper').toggle();
};

window.generarWeb3 = function(){
    var seedPhrase = lightwallet.keystore.generateRandomSeed();
    var hdPath = config.hdpath;
    lightwallet.keystore.createVault({
          password: "1234",
          seedPhrase: seedPhrase,
          hdPathString: hdPath
    }, function (err, ks) {
        if (!err){
            ks.keyFromPassword("1234", function (err, pwDerivedKey) {
                if (err) throw err;
                ks.generateNewAddress(pwDerivedKey, 1);
                var addr = ks.getAddresses();
                ks.passwordProvider = function (callback) {
                    callback(null, "1234");
                };
                setWeb3Provider(ks);
                Votacion.setProvider(web3.currentProvider);
                getVotingStatus();
            });
        }else{
            console.log(err);
        }
    });
};

window.getVotingStatus = function (){
    Votacion.deployed().then(function(contractInstance) {
        contractInstance.votingStatus.call().then(function(v){
            if (v){
                contractInstance.lookupIp.call(ipCliente).then(function(ipExiste) {
                    if (ipExiste) {
                        swal('', 'Ya se vot\u00F3 desde su IP.', 'error', {buttons:{confirm: "Aceptar"}});
                        votacionTermino = true;
                        $("#msjVotado").html("Ya no puede emitir votos.<br> A continuaci&oacute;n se detallan los resultados parciales:");
                        mostrarResultados();
                    }else{
                        votacionTermino = false;
                        if (typeof web3.currentProvider.isMetaMask !== 'undefined'){
                            if (typeof web3.eth.accounts[0] == 'undefined'){
                                swal('', 'Tu MetaMask est\u00E1 locked. Desbloqu\u00E9alo y luego actualiza la p\u00E1gina para poder votar.', 'error', {buttons:{confirm: "Aceptar"}});
                                votacionTermino = true;
                            }else{
                                contractInstance.lookupAddress.call(web3.eth.accounts[0]).then(function(v) {
                                    if (v) {
                                        swal('', 'Este address de billetera ya ha votado.', 'error', {buttons:{confirm: "Aceptar"}});
                                        votacionTermino = true;
                                        $("#msjVotado").html("Ya no puede emitir votos.<br> A continuaci&oacute;n se detallan los resultados parciales:");
                                        mostrarResultados();
                                    }else{
                                        if ($('#wrapper').css('display') == 'none'){
                                            $('#wrapper').toggle();
                                        }
                                        startVoting();
                                    }
                                });
                            }
                        }else{
                            $('#wallet').css('display','table-row');
                            $('#wallet1').css('display','table');
                            swal('', 'En la billetera de la izquierda, ingrese su palabra clave. Luego ingrese un password, que debe recordar porque tendr\u00E1 que usarlo para votar.', 'info', {buttons:{confirm: "Aceptar"}});
                        }
                    }
                });
            }else{
                votacionTermino = true;
                $("#msjVotado").html("El proceso de votaci&oacute;n ha finalizado. Ya no puede emitir votos.<br> A continuaci&oacute;n se detallan los resultados finales:");
                mostrarResultados();
            }
        });
    });
};

window.mostrarResultados = function(){
    setTimeout(function(){
        if (votacionTermino){
            $("#msjVotado").toggle();
            $('#votacion').attr('style', 'display:table-caption;');
            populateCandidates();
        }
    }, 2000);
};

window.newWallet = function() {
    swal({
        title: "Crear billetera con palabra clave",
        text: "Ingres\u00E1 un password para encriptar la llave",
        content: {
            element: "input",
            attributes: {
                placeholder: "Password",
                type: "password",
                required: true
            }
        },
        buttons: {
            confirm: "Aceptar",
            cancel: "Cancelar"
        }
    }).then(function(inputp){
        if (inputp === null) return false;
        if (inputp === "") {
            swal("", "El password no puede estar vac\u00EDo", "error");
            return false;
        }
        var password = inputp;
        var extraEntropy = document.getElementById('userEntropy').value;
        document.getElementById('userEntropy').value = '';
        var randomSeed = lightwallet.keystore.generateRandomSeed(extraEntropy);
        var hdPath = config.hdpath;
        swal ('', 'El Seed de su wallet es: "' + randomSeed + '". Es recomendable guardarlo en un lugar seguro, lo podr\u00EDa necesitar.', 'info', {buttons:{confirm: "Aceptar"}}).then(function() {
            lightwallet.keystore.createVault({
                  password: password,
                  seedPhrase: randomSeed,
                  hdPathString: hdPath
            }, function (err, ks) {
                ks.keyFromPassword(password, function (err, pwDerivedKey) {
                    if (err) throw err;
                    ks.generateNewAddress(pwDerivedKey, 1);
                    var addr = ks.getAddresses();
                    ks.passwordProvider = function (callback) {
                        swal({
                            title: "Confirmar transacci\u00F3n",
                            text: "Ingres\u00E1 tu password para continuar",
                            content: {
                                element: "input",
                                attributes: {
                                    placeholder: "Password",
                                    type: "password",
                                    required: true
                                }
                            },
                            buttons: {
                                confirm: "Aceptar",
                                cancel: "Cancelar"
                            }
                        }).then(function(pw){
                            if (pw !== null ){
                                callback(null, pw);
                            }else{
                                callback("Acci&oacute;n cancelada.", null);
                            }
                        });
                    };
                    esperandoFondos = true;
                    global_keystore = ks;
                    setWeb3Provider(ks);
                    $('#wallet1').css('display','none');
                    getBalances();
                    swal('', 'Se est\u00E1 creando una billetera con fondos para votar. Espere unos segundos.... Gracias.', 'info', {buttons:{confirm: "Aceptar"}}).then(function(){
                        $('body').addClass("loading");
                        $('.modal-msg').html("Esperando fondos...");
                        $('#wrapper').toggle();
                        startVoting();
                    });
                });
            });    
        });
    });
}

window.lookupVoterInfo = function() {
    let address = $("#voter-info").val();
    Votacion.deployed().then(function(contractInstance) {
        contractInstance.voterInfo.call(address).then(function(v) {
            if (v !== 0){
                $("#votes-cast").empty();
                $("#votes-cast").append("Vot&oacute; por: " + web3.toAscii(v).toString());    
            }else{
                $("#votes-cast").empty();
                $("#votes-cast").append("A&uacute;n no vot&oacute;");
            }
        });
    });
};

window.refreshCandidateVotes = function (){
    let candidateNames = Object.keys(candidates);
    for (var i = 0; i < candidateNames.length; i++) {
        let name = candidateNames[i];
        Votacion.deployed().then(function(contractInstance) {
            contractInstance.totalVotesFor.call(name).then(function(v) {
                $("#" + candidates[name]).html(v.toString());
            });
        });
        $('[id^=candidate-]').not('#candidate-rows').css('display','');
    }
};

window.reset = function () {
    $("#candidate-rows").empty();
    populateCandidates();
};

window.setSeed = function() {
    swal({
        title: "Recuperar su billetera desde Seed",
        text: "Ingres\u00E1 un password para encriptar la clave",
        content: {
            element: "input",
            attributes: {
                placeholder: "Password",
                type: "password",
                required: true
            }
        },
        buttons: {
            confirm: "Aceptar",
            cancel: "Cancelar"
        }
    }).then(function(inputp){
        if (inputp === null) return false;
        if (inputp === "") {
            swal("", "El password no puede estar vac\u00EDo", "error");
            return false;
        }
        var password = inputp;
        var seedPhrase = document.getElementById('seed').value.toString();
        var hdPath = config.hdpath;
        
        lightwallet.keystore.createVault({
              password: password,
              seedPhrase: seedPhrase,
              hdPathString: hdPath
        }, function (err, ks) {
            if (!err){
                ks.keyFromPassword(password, function (err, pwDerivedKey) {
                    if (err) throw err;
                    ks.generateNewAddress(pwDerivedKey, 1);
                    var addr = ks.getAddresses();
                    ks.passwordProvider = function (callback) {
                        swal({
                            title: "Confirmar transacci\u00F3n",
                            text: "Ingres\u00E1 tu password para continuar",
                            content: {
                                element: "input",
                                attributes: {
                                    placeholder: "Password",
                                    type: "password",
                                    required: true
                                }
                            },
                            buttons: {
                                confirm: "Aceptar",
                                cancel: "Cancelar"
                            }
                        }).then(function(pw){
                            if (pw !== null ){
                                callback(null, pw);
                            }else{
                                callback("Acci&oacute;n cancelada.", null);
                            }
                        });
                    };
                    swEnvio = true;
                    global_keystore = ks;
                    setWeb3Provider(ks);
                    $('#seed').val('');
                    $('#wallet1').css('display','none');
                    $('#wrapper').toggle();
                    startVoting();
                    setTimeout(function(){
                        getBalances();
                    }, 1000);
                });
            }else{
                swal("", "Error al generar wallet desde seed. Seed inv\u00E1lido.", "error", {buttons:{confirm: "Aceptar"}});
            }
        });
    });
}

window.showSeed = function() {
    swal({
        title: "Mostrar palabras Seed",
        text: "Ingrese su password para ver su Seed",
        content: {
            element: "input",
            attributes: {
                placeholder: "Password",
                type: "password",
                required: true
            }
        },
        buttons: {
            confirm: "Aceptar",
            cancel: "Cancelar"
        }
    }).then(function(inputp){
        if (inputp === null) return false;
        if (inputp === "") {
            swal("", "El password no puede estar vac\u00EDo", "error");
            return false;
        }
        var password = inputp;
        global_keystore.keyFromPassword(password, function(err, pwDerivedKey) {
            if (!err){
                var seed = global_keystore.getSeed(pwDerivedKey);
                swal('', 'El Seed de su wallet es: "' + seed + '". Es recomendable guardarlo en un lugar seguro, lo podr\u00EDa necesitar.', 'info', {buttons:{confirm: "Aceptar"}});
            }else{
                swal('', 'Password incorrecto.', 'error', {buttons:{confirm: "Aceptar"}});
            }
        });
    });
}

window.startVoting = function () {
    Votacion.setProvider(web3.currentProvider);
    setTimeout(function(){
        if (typeof web3.currentProvider.isMetaMask !== 'undefined'){
            if (typeof web3.eth.accounts[0] == 'undefined'){
                swal('', 'Tu MetaMask est\u00E1 locked. Desbloqu\u00E9alo y luego actualiza la p\u00E1gina para poder votar.', 'error', {buttons:{confirm: "Aceptar"}});
                votacionTermino = true;
            }else{
                getBalances();
                $('#wallet').css('display','table');
            }
            $('#votacion').attr('style','display:table-caption;');
            $('#wallet2').css('display','');
            populateCandidates();
        }else{
            $('#wallet1').css('display','none');
            Votacion.deployed().then(function(contractInstance) {
                contractInstance.lookupAddress.call("0x" + global_keystore.getAddresses()[0]).then(function(v) {
                    if (v) {
                        swal('', 'Este address de billetera ya ha votado.', 'error', {buttons:{confirm: "Aceptar"}});
                        votacionTermino = true;
                        $("#msjVotado").html("Ya no puede emitir votos.<br> A continuaci&oacute;n se detallan los resultados parciales:");
                        mostrarResultados();
                        $('#wrapper').toggle();
                    }else{
                        $('#votacion').attr('style','display:table-caption;');
                        $('#wallet2').css('display','');
                        $('#wallet3').css('display','');
                        populateCandidates();
                    }
                });
            });
        }
    }, 2000);
};

window.voteForCandidate = function(candidate) {
    let candidateName = candidate;
    $("#msg").html("Voto enviado. Espere unos segundos a que se publique en el blockchain.");
    $('.btnvotar').attr('disabled', true);
    $('.btnvotar').css('cursor', 'default');
    $('.modal-msg').html("Esperando validaci&oacute;n...");
    $('body').addClass("loading");
    $('#wrapper').toggle();
    try {
        web3.eth.getAccounts((err, acc) => {
            if (!err){
                web3.eth.getGasPrice(function(err, resultado) {
                    var precioGas = resultado.toNumber(10);
                    var senderAddress = acc[0].toString();
                    Votacion.deployed().then(function(contractInstance) {
                        contractInstance.voteForCandidate(candidateName, ipCliente, {gas: 314150, from: senderAddress, gasPrice: 200000000000}).then(function(cb) {
                            let div_id = candidates[candidateName];
                            return contractInstance.totalVotesFor.call(candidateName).then(function(v) {
                                $('body').removeClass("loading");
                                $('#wrapper').toggle();
                                getBalances();
                                $("#" + div_id).html(v.toString());
                                $("#msg").html("Ver transacci&oacute;n en Etherscan.io:<br><a href=\"https://ropsten.etherscan.io/tx/" + cb.tx + "\" target=\"_blank\">" + cb.tx + "</a>");
                                swal('', '\u00a1Felicitaciones, tu voto fue emitido exitosamente en el blockchain!', 'info', {buttons:{confirm: "Aceptar"}});
                                $('#msjVotado').css('display','');
                                $('#voter-info').val($('#addressSola').html());
                                var width = parseInt($('#mediascreen').css('width'));
                                if (width < 875){
                                    $('#voterinfo').css('display','block');
                                    $('#walletinfo').css('display','block');
                                }else{
                                    $('#voterinfo').css('display','table-cell');
                                }
                                refreshCandidateVotes();
                            });
                        });
                        
                    });
                });
            }else{
                $('body').removeClass("loading");
                $('.btnvotar').attr('disabled', false);
                $('.btnvotar').css('cursor', 'pointer');
                console.log(err);
                $("#msg").html("&iexcl;Ha ocurrido un error! Intenta nuevamente.");
            }
        });
    } catch (err) {
        $('body').removeClass("loading");
        $('.btnvotar').attr('disabled', false);
        $('.btnvotar').css('cursor', 'pointer');
        console.log(err);
        $("#msg").html("&iexcl;Ha ocurrido un error! Intenta nuevamente.");
    }
};

$(document).ready(function() {
    
    $('body').removeClass('loading');
    
    $.getJSON('https://freegeoip.net/json/?callback=?', function(data) {
        ipCliente = data.ip;
    });
  
    if (typeof web3 !== 'undefined') {
        if (typeof web3.currentProvider !== 'undefined') {
            Votacion.setProvider(web3.currentProvider);
            getVotingStatus();
        }else{
            generarWeb3();
        }
    }
  
    $(document).on('click', '[id^=btnvotar_]', function() {
        var candidatoElegido = $(this).attr("id").substring(9, $(this).attr("id").length);
        if (!$(this).attr('disabled')){
            voteForCandidate(candidatoElegido);
        }
    });
  
    $(document).on('focus','#userEntropy, #seed', function(){
		$(this).attr('placeholder','');
		$(this).css('text-align','left');
	});
	
	$(document).on('focusout','#userEntropy, #seed', function(){
		if ($(this).val() === ''){
			switch ($(this).attr('name')){
				case 'userEntropy':
					$(this).attr('placeholder','Ingres\u00E1 tu palabra clave');
					break;
				case 'seed':
					$(this).attr('placeholder','Ingres\u00E1 tus 12 palabras Seed');
					break;
			}
		}
		$(this).css('text-align','center');
	});
  
    setInterval(function(){
        if (!votacionTermino){
            if (document.getElementById('addressSaldo') !== null) {
                if (esperandoFondos){
                    getBalances();
                }
                if (parseFloat(document.getElementById('addressSaldo').innerHTML) >= 0.01){
                    if (swActivarVotacion === 0){
                        swActivarVotacion = 1;
                        esperandoFondos = false;
                        $('body').removeClass("loading");
                        if ($('#wrapper').css('display') == 'none') {
                            $('#wrapper').toggle();    
                        }
                        swal('','Fondos detectados. Votaci\u00F3n habilitada.', 'success', {buttons:{confirm: "Aceptar"}});
                        $('.btnvotar').attr('disabled', false);
                    }
                }
            }
        }
    }, 3000);
    
    $.get ({
        url: 'https://api.infura.io/v1/jsonrpc/ropsten/eth_blockNumber',
        success: function(resultado){
            $('#contador .texto').html("N. de bloque: " + parseInt(resultado.result));
        }
    }); 
    setInterval(function(){
        $.get ({
            url: 'https://api.infura.io/v1/jsonrpc/ropsten/eth_blockNumber',
            success: function(resultado){
                $('#contador .texto').html("N. de bloque: " + parseInt(resultado.result));
            }
        }); 
    }, 17000);
});

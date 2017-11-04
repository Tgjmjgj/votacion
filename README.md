# Votación
Sistema de Votación en Solidity (método 1 Voto-1 IP Address-1 Wallet Address).

# Características

- Detección de Metamask. Si el usuario tiene Metamask en su navegador, se utilizará por defecto para transaccionar.
- Creación de LightWallet desde el front-end de la aplicación, para usuarios que no utilizan Metamask.
- Integración por API al Faucet-Server para recibir ether al crear un nuevo wallet.
- Acceso al blockchain a través de Infura, permitiendo correr la DApp en cualquier dispositivo sin ser nodo.

# Instalación

1. Instalar dependencias:

npm install

2. Editar archivo de configuración config-truffle.js. Ingresar palabras seed y hdPath del address que se utilizará para el 

deploy del contrato.

3. Editar archivo de deploy del contrato migrations/2_deploy_contract.js con los candidatos de la votación. La duración por 

defecto de la votación es de 20 días a partir del deploy.

4. Compilar el contrato con Truffle y realizar el deploy a la red Ropsten:

node_modules/.bin/truffle migrate --compile-all --reset --network ropsten

5. Editar el archivo de configuración del front-end app/javascripts/config.js. Ingresar la url de su instancia de faucet-

server. Ingresar el hdpath de generación de LightWallet.

6. Levantar el front-end con Webpack (para desarrollo):

npm run dev

7. Ingresar desde el browser a http://localhost:50000 para testear la DApp

8. Realizar el build:

npm run build

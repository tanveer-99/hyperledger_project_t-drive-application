
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'tdrive18';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function main() {
	try {
		const ccp = buildCCPOrg1();

		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		const wallet = await buildWallet(Wallets, walletPath);

		await enrollAdmin(caClient, wallet, mspOrg1);

		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		const gateway = new Gateway();

		try {
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } 
			});

			const network = await gateway.getNetwork(channelName);

			const contract = network.getContract(chaincodeName);



			// await contract.submitTransaction('InitLedger');

			// let result = await contract.evaluateTransaction('GetAllAssets');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);



			
			// create user block
			try {
				let result = await contract.evaluateTransaction('CreateUser', 'user_tanvir3512@gmail.com', 'tanvir3512@gmail.com', 'password12345', 'Tanvir');
				await contract.submitTransaction('CreateUser', 'user_tanvir3512@gmail.com', 'tanvir3512@gmail.com', 'password12345', 'Tanvir');
				console.log(` \n create user successful \n result: ${result} \n \n`);
			} catch (error) {
				console.log(` \n *** Successfully caught the error: \n    ${error} \n \n`);
			}


			try {
				let result = await contract.evaluateTransaction('CreateUser', 'user_MDHTanvir@gmail.com', 'MDHTanvir@gmail.com', 'password12345', 'MDHTanvir');
				await contract.submitTransaction('CreateUser', 'user_MDHTanvir@gmail.com', 'MDHTanvir@gmail.com', 'password12345', 'MDHTanvir');
				console.log(` \n create user successful \n result: ${result} \n \n`);
			} catch (error) {
				console.log(` \n *** Successfully caught the error: \n    ${error} \n \n`);
			}





			// matching user found block
			try {

				let result = await contract.evaluateTransaction('FindUser', 'tanvir3512@gmail.com', 'password12345');

				console.log(`user found \n result: ${result} \n \n`);

			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}




			// matching user not found block
			// try {

			// 	let result = await contract.evaluateTransaction('FindUser', 'tanvir3512@gmail.com', 'password123456789');

			// 	console.log(`user found \n result: ${result} \n \n`);

			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			// }





			// create file block
			try {

				let result = await contract.evaluateTransaction(
					'CreateFile',
					'file_cert.txt_hash123',
					'cert.txt',
					'/files/cert.txt',
					'hash123',
					'tanvir3512@gmail.com'
				);

				await contract.submitTransaction(
					'CreateFile',
					'file_cert.txt_hash123',
					'cert.txt',
					'/files/cert.txt',
					'hash123',
					'tanvir3512@gmail.com'
				);
	
				console.log(`File created \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}
	




			try {

				let result = await contract.evaluateTransaction(
					'CreateFile',
					'file_letter.txt_hash567',
					'letter.txt',
					'/files/letter.txt',
					'hash567',
					'tanvir3512@gmail.com'
				);

				await contract.submitTransaction(
					'CreateFile',
					'file_letter.txt_hash567',
					'letter.txt',
					'/files/letter.txt',
					'hash567',
					'tanvir3512@gmail.com'
				);
	
				console.log(`File created \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}
				




			// Find file block
			try {

				let result = await contract.evaluateTransaction('FindFile', 'file_cert.txt_hash123');
	
				console.log(`File Found \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}





		
			// change file name block
			try {

				let result = await contract.evaluateTransaction(
					'ChangeFileName',
					'file_cert.txt_hash123',
					'cert_new.txt',
					'uploads/cert_new.txt'
				);

				await contract.submitTransaction(
					'ChangeFileName',
					'file_cert.txt_hash123',
					'cert_new.txt',
					'uploads/cert_new.txt'
				);
	
				console.log(`File name changed \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}






		
			// delete file block
			// try {

			// 	let result = await contract.evaluateTransaction(
			// 		'DeleteFile',
			// 		'file_letter.txt_hash567',
			// 	);

			// 	await contract.submitTransaction(
			// 		'DeleteFile',
			// 		'file_letter.txt_hash567',
			// 	);
	
			// 	console.log(`File deleted \n result: ${result} \n \n`);
	
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			// }






			// find file by user block
			try {
				const email = "tanvir3512@gmail.com";
				let result = await contract.evaluateTransaction('FindFileByUser', 'tanvir3512@gmail.com');
	
				console.log(`Files found for email ${email} \n Result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}






			// FileShare block
			try {

				let result = await contract.evaluateTransaction(
					'ShareFile',
					'fileShare_cert.txt_hash123',
					'file_cert.txt_hash123',
					'MDHTanvir@gmail.com'
				);

				await contract.submitTransaction(
					'ShareFile',
					'fileShare_cert.txt_hash123',
					'file_cert.txt_hash123',
					'MDHTanvir@gmail.com'
				);
	
				console.log(`File Shared \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}




			try {

				let result = await contract.evaluateTransaction(
					'ShareFile',
					'fileShare_letter.txt_hash567',
					'file_letter.txt_hash567',
					'MDHTanvir@gmail.com'
				);

				await contract.submitTransaction(
					'ShareFile',
					'fileShare_letter.txt_hash567',
					'file_letter.txt_hash567',
					'MDHTanvir@gmail.com'
				);
	
				console.log(`File Shared \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}







			// Find fileShare by file block
			try {

				let result = await contract.evaluateTransaction(
					'FindFileShareByFile',
					'file_letter.txt_hash567',
				);
	
				console.log(`FileShare list for particular file \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}
			






			// Find fileShare by user block
			try {

				let result = await contract.evaluateTransaction(
					'FindFileSharedWithUser',
					'MDHTanvir@gmail.com'
				);
	
				console.log(`FileShare list for particular user \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}
			






			// delete fileShare
			try {

				let result = await contract.evaluateTransaction(
					'DeleteFileShare',
					'fileShare_letter.txt_hash567',
				);

				await contract.submitTransaction(
					'DeleteFileShare',
					'fileShare_letter.txt_hash567',
				);
	
				console.log(`FileShare deleted \n result: ${result} \n \n`);
	
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error} \n \n`);
			}








			
		} finally {
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();

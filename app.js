
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





			
			////////////////////////////////////////////////////////////////////////////

			//create server


			const express = require('express');
			const cookieParser = require('cookie-parser')
			const fileUpload = require('express-fileupload')
			const path= require('path');
			const crypto = require('crypto');
			const fs = require('fs');
			const util = require('util');


			let app = express();
			
			const PORT = 3000;


			app.use(express.urlencoded({ extended: false }))
			app.use(express.json())
			app.use(cookieParser())
			app.use(fileUpload({
				useTempFiles : true,
				tempFileDir : 'tmp/',
				createParentPath: true,
			}));
			app.use(express.static('public'));


			app.get('/', (req, res) => {
				res.send("welcome to T-Drive");
			})





			// create user api
			app.post('/register', async  (req, res) => {
				const {email, password, name} = req.body;
				const id = `user_${email}`;

				try {
					let result = await contract.evaluateTransaction(
						'CreateUser', 
						id, 
						email, 
						password, 
						name
					);
					await contract.submitTransaction(
						'CreateUser', 
						id, 
						email, 
						password, 
						name
					);
					
					res.send(result.toString());

				} catch (error) {
					res.status(400).send(error.toString());
				}

			})




			// login user api
			app.post('/login', async  (req, res) => {

				const {email, password} = req.body;

				try {
					let result = await contract.evaluateTransaction(
						'FindUser', 
						email, 
						password
					);
					res.cookie('user', result.toString(), { maxAge: 3600_000, httpOnly: true });
					
				res.send(result.toString());

				} catch (error) {
					res.status(400).send(error.toString());
				}

			})





			// logout user api
			app.get('/logout', async  (req, res) => {

				const {email, password} = req.body;

				try {
					
					res.cookie('user', '', { maxAge: -1, httpOnly: true });
					
					res.send("You have successfully logged out");

				} catch (error) {
					res.status(400).send(error.toString());
				}

			})




			// creating fileHash with sha-256
			async function sha256(filePath) {
					const readFile = util.promisify(fs.readFile);
					const hash = crypto.createHash('sha256');
					const data = await readFile(filePath);
					hash.update(data);

					return hash.digest('base64');
					
			}





			// create file api
			app.post('/file', async function (req, res) {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const uploadedFile = req.files?.uploadedFile;

				if (uploadedFile == undefined) {
					res.status(400).send("you must upload a file");
					return;
				}

				const fileName = uploadedFile.name;
				const fileDestination = path.join('public', 'uploadedFiles', fileName);
				uploadedFile.mv(fileDestination, async (error) => {

					if(error != undefined) {
						res.status(500).send(`server error, failed to move file ${error}`);
						return;
					}


				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					const downloadLink = path.join('uploadedFiles', fileName);
					const uploaderEmail = user.Email; 
					const id = `file_${uploaderEmail}_${fileName}`;
					const fileHash = await sha256(fileDestination);


					
					let result = await contract.evaluateTransaction(
						'CreateFile',
						id,
						fileName,
						downloadLink,
						fileHash,
						uploaderEmail
					);
					await contract.submitTransaction(
						'CreateFile',
						id,
						fileName,
						downloadLink,
						fileHash,
						uploaderEmail
					);
					res.send(result.toString());
				} catch (error) {
					res.status(400).send(error.toString());
				}

				})
				
			})




			// find file by user api
			app.get('/file', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				try {
					const user = JSON.parse(req.cookies.user.toString());
					let result = await contract.evaluateTransaction('FindFileByUser', user.Email);
					res.send(result.toString());
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})




			// findFile api
			app.get('/file/:fileKey', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const fileKey = req.params.fileKey;

				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFile', fileKey);
					
					const uploadedFile = JSON.parse(result);

					result = await contract.evaluateTransaction('FindFileSharedWithUser', user.Email);

					let filesSharedWithMe = JSON.parse(result);

					filesSharedWithMe = filesSharedWithMe.map(data => data.Record);

					const thisFileSharedWithMe = filesSharedWithMe.some(fileShare => fileShare.FileKey == uploadedFile.ID);
					
					if (uploadedFile.UploaderEmail != user.Email && !thisFileSharedWithMe) {
						res.status(403).send("you are not authorized to view this file");
					}
					else {
						res.send(JSON.stringify(uploadedFile));
					}
				
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})





			// ChangeFileName api
			app.put('/file/:fileKey', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const fileKey = req.params.fileKey;

				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFile', fileKey);
					
					const uploadedFile = JSON.parse(result);

					const newFileName = req.body.newFileName;
					
					if (uploadedFile.UploaderEmail != user.Email) {
						res.status(403).send("you are not authorized to update this file");
					}
					else {

						// move file and update download links
						const renameFile = util.promisify(fs.rename);
						const srcPath = path.join('public', uploadedFile.DownloadLink);
						const destinationPath = path.join('public', 'uploadedFiles', newFileName);
						const err = await renameFile(srcPath, destinationPath);

						const newDownloadLink = path.join('uploadedFiles', newFileName);

						if(err != undefined) {
							res.status(500).send(`server error ${err}`);
						}

						let result = await contract.evaluateTransaction(
							'ChangeFileName',
							fileKey,
							newFileName,
							newDownloadLink
						);

						await contract.submitTransaction(
							'ChangeFileName',
							fileKey,
							newFileName,
							newDownloadLink
						);
						res.send(result.toString());
					}
				
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})





			// delete file api
			app.delete('/file/:fileKey', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const fileKey = req.params.fileKey;

				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFile', fileKey);
					
					const uploadedFile = JSON.parse(result);

					
					if (uploadedFile.UploaderEmail != user.Email) {
						res.status(403).send("you are not authorized to delete this file");
					}
					else {

						// delete file
						const deleteFile = util.promisify(fs.unlink);
						const srcPath = path.join('public', uploadedFile.DownloadLink);
						const err = await deleteFile(srcPath);

						if(err != undefined) {
							res.status(500).send(`server error ${err}`);
						}

						let result = await contract.evaluateTransaction(
							'DeleteFile',
							fileKey,
						);

						await contract.submitTransaction(
							'DeleteFile',
							fileKey,
						);
						res.send(result.toString());
					}
				
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})




			// fileShare api
			app.post('/fileShare', async  (req, res) => {
				const { fileKey, sharedWithEmail } = req.body; 
				const id = `fileShare_${fileKey}_${sharedWithEmail}`;

				try {
					let result = await contract.evaluateTransaction(
						'ShareFile', 
						id, 
						fileKey, 
						sharedWithEmail
					);
					await contract.submitTransaction(
						'ShareFile', 
						id, 
						fileKey, 
						sharedWithEmail
					);
					
					res.send(result.toString());

				} catch (error) {
					res.status(400).send(error.toString());
				}

			})





			// fileShare by file api
			app.get('/fileShare/byFile/:fileKey', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const fileKey = req.params.fileKey;

				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFile', fileKey);
					
					const uploadedFile = JSON.parse(result);
					
					if (uploadedFile.UploaderEmail != user.Email) {
						res.status(403).send("you are not authorized to view this file");
					}
					else {
						let result = await contract.evaluateTransaction('FindFileShareByFile', fileKey);
						res.send(result.toString());
					}
				
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})




			// fileShare by user api
			app.get('/fileShare/withMe', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}


				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFileSharedWithUser', user.Email);
				
					res.send(result.toString());
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})





			// delete fileShare
			app.delete('/fileShare/:fileShareKey', async (req, res) => {

				if(req.cookies.user == null) {
					res.status(400).send("you are not logged in");
					return;
				}

				const fileShareKey = req.params.fileShareKey;

				try {

					const user = JSON.parse(req.cookies.user.toString());
					
					let result = await contract.evaluateTransaction('FindFileShare', fileShareKey);
					
					const fileShare = JSON.parse(result);

					const fileKey = fileShare.FileKey;

					result = await contract.evaluateTransaction(
						'FindFile',
						fileKey,
					);

					const uploadedFile = JSON.parse(result);

					
					if (uploadedFile.UploaderEmail != user.Email && fileShare.SharedWithEmail != user.Email) {
						res.status(403).send("you are not authorized to delete this file");
					}
					else {

						let result = await contract.evaluateTransaction(
							'DeleteFileShare',
							fileShareKey,
						);

						await contract.submitTransaction(
							'DeleteFileShare',
							fileShareKey,
						);
						res.send(result.toString());
					}
				
				} catch (error) {
					res.status(400).send(error.toString());
				}


			})



			var server = app.listen(PORT, () => {
				console.log(`server listening on port http://localhost:${PORT}`);
			})


			////////////////////////////////////////////////////////////////////////////



			
		} finally {
			// gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();

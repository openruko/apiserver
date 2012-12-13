.PHONY: init certs database

init:
	npm install .

certs: 
	mkdir -p certs/
	@echo "Do not use a passphrase for temporary certs"
	ssh-keygen -t rsa -f certs/server.key
	@echo "Temporary certs have been setup in certs/ directory"
	openssl genrsa -out certs/server-key.pem 1024
	openssl req -new -key certs/server-key.pem -out certs/server-csr.pem
	openssl x509 -req -in certs/server-csr.pem -signkey certs/server-key.pem -out certs/server-cert.pem
	


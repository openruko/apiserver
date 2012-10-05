.PHONY: init certs database

init:
	npm install .

certs: 
	mkdir -p certs/
	@echo "Do not use a passphrase for temporary certs"
	ssh-keygen -t rsa -f certs/server.key
	@echo "Temporary certs have been setup in certs/ directory"



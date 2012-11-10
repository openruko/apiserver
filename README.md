# Api Server - The oracle of the dyno world

## Introduction

The apiserver is the central server and API endpoint for OpenRuko, it is written in Node.js
and uses PostgreSQL to persist state.  It exposes methods via a restful API to query and
manipulate the state of the system, dyno hosts call in periodically to pick up jobs which 
we try to distribute fairly by holding on to each request for a small amount of time in 
order to determine the least burden dyno node. The API tries to aims to be compatible with Heroku 
client tools, and whilst certain features such as addons, ssl certs aren't support this 
is an ongoing effort. 

## Requirements

Tested on Linux 3.2 using node 0.8 and postgreSQL 9.1.

On a fresh Ubuntu 12.04 LTS instance:  

PostgreSQL 9.1:  
https://help.ubuntu.com/community/PostgreSQL
(after installing, createdb root is handy)

```
apt-get install postgresql postgresql-client postgresql-server-dev-9.1
apt-get install postgresql-contrib-9.1 # required for pycrypto hstore etc..
apt-get install uuid-dev # required by node-uuid 
```

Node.js 0.8.x is not available in available Ubuntu repositories, however Chris Lea
provides a PPA that works very well, following the instructions onsite adding the
relevant lines to /etc/apt/sources.list

```
apt-key adv --recv-key --keyserver keyserver.ubuntu.com B9316A7BC7917B12
apt-get update
apt-get install nodejs npm
```

Please share experiences with CentOS, Fedora, OS X, FreeBSD etc... 

## Installation

```
git clone https://github.com/openruko/apiserver.git apiserver  
cd apiserver  
```

Install node.js dependencies:
```
make init
```

Create an ssh key
```
ssh-keygen -t rsa
```

Create database (apologises for the robustness of the db boostrap script)
```
createuser -s -U postgres --interactive
# enter your login name
cd postgres
./setup
```

Create certs for the rendezvous endpoint (tls):
```
make certs
```

## Environment Variables

Other environment variables could be configured but the following ones are required.

Edit your ~/.bashrc and add the following lines:
```
export API_SERVER_KEY=$WHAT_WAS_WRITTEN_AT_THE_END_OF_POSTGRES_SETUP
export PGUSER=$YOUR_LOGIN_NAME
export S3_KEY=$YOUR_AMAZON_S3_KEY
export S3_SECRET=$YOUR_AMAZON_S3_SECRET
export S3_BUCKET=$YOUR_AMAZON_S3_BUCKET
```


apiserver/bin/apiserver will check for the presence of several environment variables,
these must be configured as part of the process start - e.g. configured in 
supervisord or as part of boot script see ./debug.launch for example

* BASE_HOST - base host of the API server (e.g. localhost:5000)
* BASE_PROTOCOL- base protocl of the API server (e.g. http)
* PORT - TCP port to bind server to (<1024 require superuser privileges)
* PRIVATE_KEY - Path to private key in pem format (can be relative to project root)
* PUBLIC_KEY - Path to public key in pem format (can be relative to project root)
* S3_KEY - Your AWS S3 key for the repo and slug bucket
* S3_SECRET - Your AWS S3 secret for the repo and slug bucket
* S3_BUCKET - Name of S3 bucket to store slugs and repos

## Help and Todo 

Loads to do on this part, not limited to:

* Improve setup scripts and find a path to database migrations.

* Missing features

* In updatestate handle logic to handle failed instance, retries, and kills - if
dyno is not consistent with state in database.

## License

apiserver and other openruko components are licensed under MIT.  
[http://opensource.org/licenses/mit-license.php](http://opensource.org/licenses/mit-license.php)

## Authors and Credits

Matt Freeman  
[email me - im looking for some remote work](mailto:matt@nonuby.com)  
[follow me on twitter](http://www.twitter.com/nonuby )



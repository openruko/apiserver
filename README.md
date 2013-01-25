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
apt-get install python-software-properties
```

Node.js 0.8.x is not available in available Ubuntu repositories, however Chris Lea
provides a PPA that works very well, following the instructions onsite adding the
relevant lines to /etc/apt/sources.list

```
add-apt-repository ppa:chris-lea/node.js
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

Create database
```
sudo -u postgres createuser -s -P -U postgres
# enter your login name
# enter the password, for exemple openruko
createdb openruko
```

Create certs for the rendezvous endpoint (tls):
```
make certs
```

## Environment Variables

apiserver/bin/apiserver will check for the presence of several environment variables,
these must be configured as part of the process start - e.g. configured in 
supervisord or as part of boot script see ./apiserver/conf.js

* APISERVER_KEY - special key for other services to authenticate with API server (you can generate one with `uuidgen`)
* PG_USER - Your login name, unless you set something else.
* PG_PASSWORD - Your postgresql password, for exemple openruko
* S3_KEY - You need an Amazon S3 account to store repos and slug archive
* S3_SECRET - You need an Amazon S3 account to store repos and slug archive
* S3_BUCKET - You need an Amazon S3 account to store repos and slug archive

If you don't want to use Amazon S3, you could use a clone like [fakes3](https://github.com/jubos/fake-s3).
Just add the following environment variable:

* S3_HOSTNAME - If yout host an S3 clone on your machine use mymachine.me in place of localhost.
* S3_PORT - The S3 clone listening port.

## Launch

```
$ cat > .env << EOF
APISERVER_KEY=xxx
PG_PASSWORD=xxx
S3_KEY=xxx
S3_SECRET=xxx
S3_BUCKET=xxx
EOF

foreman start
```

## Create a user

Once apiserver launched, you will need to create your first user.

```
./apiserver/bin/adduser
```

## Test

```
npm test
```

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



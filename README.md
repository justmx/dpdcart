### DBDcart content download

Download content of DBDcart (A demo of NodeJS project combined with casperjs and other libs)

### Usage

1. clone this repo

2. install required libs

	```bash
	  npm install -g casperjs
	```

3. install project packages

	```bash
	  cd dpdcart
	  npm install
	```
4. Create a default.json file in ./config and update your cred in the following format

```bash
{
  "domains": [
    {
      "url": "https://domain1.dpdcart.com",
      "domain": "domain1",
      "username": "your_username",
      "password": "your_password"
    }
  ]
}
```

5. run the app

	```bash
	  node index.js
	```

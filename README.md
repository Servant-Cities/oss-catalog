## How to run

Configure active services

You can first copy the example template (all services activated)
```
cp example.active-services.ini active-services.ini
```

and then modify it to fit your needs:
```
nano active-services.ini
```

Then run the following command to deploy all configured services.
```
yarn run deploy_from_ini
```
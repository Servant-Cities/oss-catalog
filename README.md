## How to run locally

Configure active services

You can first copy the example template (all services activated)
```
cp example.active-services.ini active-services.ini
```

and then modify it to fit your needs:
```
nano active-services.ini
```

If you run some services on localhost, you need to update your device's hosts file, this is necessary to enable observability which is itself required to properly sequence some deployments. (the script doesn't delete anything there)
```
sudo yarn run update_hosts_file_from_ini
```

Then run the following command to deploy all configured services.
```
yarn run locally_deploy_from_ini
```

## Production

### Control list
- [] DNS zone points to nginx instance
- [] Firewall on nginx instance's server accepts connections on port 80 and 443
- [] git installed
- [] nodejs installed
- [] yarn installed
- [] docker installed

### Run
```
yarn run deploy_from_ini
```

## Usefull scripts

### Remove from INI
Usefull in case you want to safely delete your current containers (eg to run a  deployment with updated values or clean your device after you tested locally) - Does not delete volumes
```
yarn run remove_from_ini
```
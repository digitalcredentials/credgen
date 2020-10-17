# credgen

There are two primary uses:
- Manage templates
- Create verifiable credentials, referencing above templates

## Quick start

```
npm install
npm link
credgen --help
```

## Manage templates

### About

There are currently 3 template categories:
- issuer
- achievement
- credentials (unsigned verifiable credentials)

The command line options are currently populate from metatemplates (see the .mustache files), but this can be generalized and improved upon.

### Demo Templates

To see some example templates, you can do one of the following. 

Run this command to populate all 3 types of templates:

```
credgen generate-sample-templates
```

Alternatively, you can run these 3 individual commands, resulting in the same templates.

```
credgen issuer init sampleIssuer --id 'did:example:1234' --name 'Demo Issuer' --url 'http://example.org'
credgen achievement init sampleAchievement --id 'http://example.org/achievements/demo' --type DemoAchievementType --name 'Demo Achievement' --description 'Everything about Demo Achievement...'
credegen credential init sampleCredential partial:issuer sampleIssuer partial:achievement sampleAchievement
```


### Temmplate storage

We use a storage abstraction that allows you to store templates on the local file system (default) or s3 (TODO list other currently supported options).

The default storage location is under your home directory:
```
local://${os.homedir()}/credgen/templates
```

This can be overridden using the env var `CG_STORAGE_URL`. TODO: also support config file. 

### Example usage

TODO: someone please give better examples

The following examples are for the achievement profile type. Other profile types have identical usage.

Type `--help` after any command/subcommand for detailed usage information. For example:
```
credgen achievement init --help
``` 
will list the parameters required by the `achievement` metatemplate. 


describe the 'metallurgy' achievement

```
credgen achievement describe metallurgy
```

list achievements

```
credgen achievement ls
```

add a 'chickenHusbandry' achievement

```
credgen achievement init chickenHusbandry [options]
```

remove 'chickenHusbandry' achievement

```
credgen achievement rm chickenHusbandry
```

Cat the 'chickenHusbandry' achievement

```
credgen achievement cat chickenHusbandry
```


## Generate credential

Specify an issuer profile, achievement profile, and vc template with (TODO: currently sample is hardcoded) learner data

### Example usage

```
credgen generate --issuer xpro -a additiveManufacturing -c vc
```

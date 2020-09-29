# credgen-ts

There are two primary uses:
- Manage profiles, which are descriptions of issuers, achievements, and verifiable credential templates (without learner data)
- Create verifiable credentials, referencing above profiles

## Manage profile

Manage the following profile types:
- issuer
- achievement
- vc templates

Note that VC profiles are only partially specified because they do not have learner instance data. This is the reason for the apparent naming inconsistency.

### Example usage

The following examples are for the achievement profile type. Other profile types have identical usage

describe the 'metallurgy' achievement

```
npm run start achievement describe metallurgy
```

list achievements

```
npm run start achievement ls
```

add a 'chickenHusbandry' achievement

```
npm run start achievement init chickenHusbandry
```

remove 'chickenHusbandry' achievement

```
npm run start achievement rm chickenHusbandry
```


## Generate credential

Specify an issuer profile, achievement profile, and vc template with (TODO: currently sample is hardcoded) learner data

### Example usage

```
npm run start -- generate --issuer xpro -a additiveManufacturing -c vc
```

#!/usr/bin/env node

import dotenv from "dotenv";
import os from "os";
import program, { parseOptions } from "commander";
import { Storage } from '@tweedegolf/storage-abstraction';
import { newCredentialFromProfiles } from "./credential";
import { ProfileManager, getProfileManagers } from "./profiles";

dotenv.config();

function increaseVerbosity(ignore, previous) {
  return previous + 1;
}

function configure(c: program.Command, mgr: ProfileManager) {
  const profileType = c.name();
  const initC = c.command('init <key>');
  mgr.params().forEach((p) => {
    initC.option(`--${p} <${p}>`, 'profile parameters; leave blank to initalize templatized', `{{${p}}}`);
  })
  initC.action((key, opts) => {
      mgr.init(key, opts)
      .then((result) => {
        console.log(`${profileType} profile ${result.profileName} created as: ${result.fileName}`);
      });
    });
  c.command('ls')
    .action(() => {
      mgr.list()
        .then((result) => {
          console.log(result);
        })
    });
    c.command('describe <key>')
    .action((key) => {
      mgr.get(key)
        .then((result) => {
          console.log(`Profile ${key}:\n\n ${JSON.stringify(result, null, 2)}`); 
        });
    });
  c.command('rm <key>')
    .action((key) => {
      mgr.remove(key)
      .then((result) => {
        console.log(`Removed profile ${key}:\n\n ${result}`); 
      });
    });
  return c;
}

const c = program.version('0.0.1').description('credential and credential profile generator');

const url = process.env.CG_STORAGE_URL || `local://${os.homedir()}/credgen/profiles/issuers?mode=750`;
console.log(url);
const s = new Storage(url);

const profileManagers = getProfileManagers(s);
profileManagers.forEach(t => configure(c.command(t.profileType), t));

c.command('generate')
.requiredOption('-i, --issuer <issuer>', 'issuer profile')
.requiredOption("-a, --achievement <achievement>", "achievement profile")
.requiredOption("-c, --credentialTemplate <credentialTemplate>", "verifiable credential template")

.option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
.action(async (opts) => {
  console.log(`Issuer: ${opts.issuer}\nAchievement: ${opts.achievement}\nCredential Template: ${opts.credentialTemplate}`);
  
  let [issuerMgr, achievementMgr, credentialMgr] = profileManagers;
  const issuer = await issuerMgr.get(opts.issuer);
  const achievement = await achievementMgr.get(opts.achievement);
  const credentialTemplate = await credentialMgr.get(opts.credentialTemplate);

  if (opts.verbose > 0) {
    console.log(`issuer: ${JSON.stringify(issuer)}`);
    console.log(`achievement: ${JSON.stringify(achievement)}`);
    console.log(`credentialTemplate: ${JSON.stringify(credentialTemplate)}`);
  }

  let credential = newCredentialFromProfiles(credentialTemplate, issuer, achievement);
  
  console.log('foo:' + JSON.stringify(credential, null, 2));
  // the parts that vary per learner
  const learnerData = {
    type: "Person",
    name: "Sample Learner"
  }
 // credential.addLearnerData("did:example:learner", learnerData);

  //credentialId: string, credentialName?: string, credentialDescription?: string, image?: stringg
 // credential.updateIssuanceDate();

  // the parts that vary per learner/credential issuance
  //credential.addCredentialInstanceData("https://example.org/path/to/credential", 
  //  "Additive Manufacturing: Technology Principles and Applications", 
  //  "This credential certifies that Sample Learner has successfully completed the Additive Manufacturing: Technology Principles and Applications program requirements");
  
 // console.log(JSON.stringify(credential.toJson(), null, 4));
});

program.parse(process.argv);

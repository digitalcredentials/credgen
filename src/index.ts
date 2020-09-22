import program, { parseOptions } from "commander";
import { Storage } from '@tweedegolf/storage-abstraction';
import { newCredentialFromProfiles } from "./credential";
import { ProfileManager, getProfileManagers } from "./profiles";


function configure(c: program.Command, mgr: ProfileManager) {
  const profileType = c.name();
  c.command('init <name>')
    .action((name) => {
      mgr.init(name)
      .then((result) => {
        console.log(`${profileType} profile ${result.profileName} created. Fill out the file: ${result.fileName}`);
      });
    });
  c.command('ls')
    .action(() => {
      mgr.list()
        .then((result) => {
          console.log(result);
        })
    });
    c.command('describe <name>')
    .action((name) => {
      mgr.get(name)
        .then((result) => {
          console.log(`Profile ${name}:\n\n ${JSON.stringify(result, null, 2)}`); 
        });
    });
  c.command('rm <name>')
    .action((name) => {
      mgr.remove(name)
      .then((result) => {
        console.log(`Remove profile ${name}:\n\n ${result}`); 
      });
    });
  return c;
}

const c = program.version('0.0.1').description('credential and credential profile generator');

const url = "local:///Users/kim/projects/credgen-ts/profiles/issuers?mode=750";
const s = new Storage(url);

const profileManagers = getProfileManagers(s);
profileManagers.forEach(t => configure(c.command(t.profileType), t));

c.command('generate')
.requiredOption('-i, --issuer <issuer>', 'issuer profile')
.requiredOption("-a, --achievement <achievement>", "achievement profile")
.requiredOption("-c, --credentialTemplate <credentialTemplate>", "verifiable credential template")
.action(async (opts) => {
  console.log(`Issuer: ${opts.issuer}\nAchievement: ${opts.achievement}\nCredential Template: ${opts.credentialTemplate}`);
  
  let issuerMgr, achievementMgr, credentialMgr = null;
  [issuerMgr, achievementMgr, credentialMgr] = profileManagers;
  const issuer1 = await issuerMgr.get(opts.issuer);
  //console.log(`issuer: ${JSON.stringify(issuer1)}`);
  const achievement1 = await achievementMgr.get(opts.achievement);
  //console.log(`achievement: ${JSON.stringify(achievement1)}`);
  const credentialTemplate1 = await credentialMgr.get(opts.credentialTemplate);
  //console.log(`credentialTemplate: ${JSON.stringify(credentialTemplate1)}`);
  let credential = newCredentialFromProfiles(credentialTemplate1, issuer1, achievement1);

  // the parts that vary per learner
  credential.addLearnerData("did:example:learner", "Sample Learner");
  
  // the parts that vary per learner/credential issuance
  credential.addCredentialInstanceData("https://example.org/path/to/credential", 
    "Additive Manufacturing: Technology Principles and Applications", 
    "This credential certifies that Sample Learner has successfully completed the Additive Manufacturing: Technology Principles and Applications program requirements");
  
  console.log(JSON.stringify(credential.toJson(), null, 4));
});

program.parse(process.argv);



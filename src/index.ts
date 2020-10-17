#!/usr/bin/env node

import dotenv from "dotenv";
import os from "os";
import program from "commander";
import { Storage } from '@tweedegolf/storage-abstraction';
import { AchievementString, CredentialString, getCredentialManagerTemplates, getTemplateManagers, IssuerString } from "./templates";
import { TemplateRenderer } from "./TemplateRenderer";
import { TemplateManager } from "./TemplateManager";
import { TemplateArg } from "./argParser";


dotenv.config();

function increaseVerbosity(ignore: any, previous: number) {
  return previous + 1;
}

function configure(c: program.Command, mgr: TemplateManager) {
  const metaTemplateName = c.name();
  const initC = c.command('init <key>')
    .description(`manage ${c.name()} templates`); // TODO: why isn't this displayed?
  mgr.partials().forEach((p: TemplateArg) => {
    initC.requiredOption(p.commandLineFlags, p.description);
  })
  mgr.params().forEach((p: TemplateArg) => {
    initC.option(p.commandLineFlags, p.description, p.defaultValue!);
  })
  initC.action((key, opts) => {
    mgr.init(key, opts)
      .then((result) => {
        console.log(`${metaTemplateName} template ${result.templateName} created as: ${result.fileName}\n`);
      });
  });
  c.command('ls')
    .action(() => {
      mgr.list()
        .then((result) => {
          console.log(`${result}`);
        })
    });
  c.command('cat <key>')
    .action((key) => {
      mgr.get(key)
        .then((result) => {
          console.log(`Template ${key}:\n\n ${JSON.stringify(result, null, 2)}\n`);
        });
    });
  c.command('rm <key>')
    .action((key) => {
      mgr.remove(key)
        .then(() => {
          console.log(`Removed template ${key}\n`);
        });
    });
  return c;
}

const c = program.version('0.0.1').description('credential and credential template generator');

const url = process.env.CG_STORAGE_URL || `local://${os.homedir()}/credgen/templates/issuers?mode=750`;
const s = new Storage(url);

const templateCategories: Map<string, TemplateManager> = getTemplateManagers(s);
templateCategories.forEach((tm, key) => {
  configure(c.command(tm.metaTemplateName), tm);
});


c.command(`generate-sample-templates`)
  .action(async () => {
    let issuerOpts = {
      issuerId: 'did:example:1234',
      issuerImage: '',
      issuerName: 'Demo Issuer',
      issuerUrl: 'http://example.org'
    };
    let achievementOpts = {
      achievementType: 'DemoAchievementType',
      achievementId: 'http://example.org/achievements/demo',
      achievementName: 'Demo Achievement',
      achievementDescription: 'Everything about Demo Achievement...',
    };
    let credentialOpts = {
      'issuer': 'sampleIssuer',
      'achievement': 'sampleAchievement'
    }

    await templateCategories.get(IssuerString).init('sampleIssuer', issuerOpts);
    await templateCategories.get(AchievementString).init('sampleAchievement', achievementOpts);
    await templateCategories.get(CredentialString).init('sampleCredential', credentialOpts);
  })

getCredentialManagerTemplates()
  .then((templateInfo) => {
    templateInfo.forEach((ti: TemplateRenderer) => {
      let ci = c.command(`generate-from-${ti.name()}`)
      ti.partials().forEach((p: TemplateArg) => {
        ci.requiredOption(p.commandLineFlags, p.description);
      })
      ti.params().forEach((p: any) => {
        ci.option(p.commandLineFlags, p.description, p.defaultValue);
      })
      ci.option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
        .action(async (opts) => {
          let result = await ti.render(opts);
          console.log(result);
        });
    });

    program.parse(process.argv);
  })

import { Storage } from '@tweedegolf/storage-abstraction';

import mustache from "mustache";
import path from "path";
import fs from "fs";

import { TemplateManager } from './TemplateManager';
import { TemplateRenderer, TemplateRendererWithPartials } from './TemplateRenderer';

export const IssuerString = 'issuer';
export const AchievementString = 'achievement';
export const CredentialString = 'credential';


// Look up category, and the lookup template
async function expandPartial(key: string, value: string): Promise<any> {
  if (!value) {
    throw new Error(`No value provided for ${key}`);
  }
  if (!templateCategories.has(key)) {
    throw new Error(`unknown category: ${key}`);
  }
  const tm = templateCategories.get(key)
  return tm.get(value);
}

export function getDefaultMetaTemplate(metaTemplateFileName: string): string {
  let fileName = path.join(__dirname, metaTemplateFileName);
  let template = fs.readFileSync(fileName).toString();
  return template;
}


// These are default categpries and metatemplates; we should make everything customizable by config
let templateCategories = new Map<string, TemplateManager>([
  [IssuerString, new TemplateManager(IssuerString, 
    new TemplateRenderer(IssuerString, getDefaultMetaTemplate('issuerTemplate.mustache')))],
  [AchievementString, new TemplateManager(AchievementString, 
    new TemplateRenderer(AchievementString, getDefaultMetaTemplate('achievementTemplate.mustache')))],
  [CredentialString, new TemplateManager(CredentialString, 
    new TemplateRendererWithPartials(CredentialString, getDefaultMetaTemplate('credentialTemplate.mustache'), expandPartial))]
]);

export function getTemplateManagers(storage: Storage) {
  templateCategories.forEach((tm: TemplateManager, key: string) => {
    tm.setStorage(storage);
  });
  return templateCategories;
}

// Expand all the credential templates to provide detailed command line args for credential creation
export async function getCredentialManagerTemplates(): Promise<TemplateRenderer[]> {
  let credentialManager = templateCategories.get(CredentialString);
  return credentialManager.list()
    .then(async (credentialTemplateNames) => {
      return await Promise.all(credentialTemplateNames.map(async function (templateName: string) {
        let template = await credentialManager.get(templateName);
        return new TemplateRendererWithPartials(templateName, JSON.stringify(template), expandPartial);
      }));
    });
}



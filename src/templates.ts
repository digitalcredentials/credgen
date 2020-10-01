import { Storage } from '@tweedegolf/storage-abstraction';

import mustache from "mustache";
import path from "path";
import fs from "fs";

export const IssuerString = 'issuer';
export const AchievementString = 'achievement';
export const CredentialString = 'credential';
export const PartialPrefix = 'partial:';
const JsonFileExtension = '.json';
export const NameToken = 'name';
export const PartialTemplateToken = '>';
const PartialTemplatePrefix = `{{${PartialTemplateToken}`;

interface KVP {
  key: string;
  value: any;
}

export async function getCredentialTemplates() : Promise<TemplateRenderer[]> {
  return credentialManager.list()
    .then(async (credentialTemplateNames) => {
      return await Promise.all(credentialTemplateNames.map(async function (templateName: string) {
        let template = await credentialManager.get(templateName);
        return new TemplateRenderer(templateName, JSON.stringify(template));
      }));
    });
}

function getMetaTemplate(metaTemplateName: string): string {
  let fileName = null;
  if (metaTemplateName === IssuerString) {
    fileName = path.join(__dirname, 'issuerTemplate.mustache');
  } else if (metaTemplateName === AchievementString) {
    fileName = path.join(__dirname, 'achievementTemplate.mustache');
  } else if (metaTemplateName === CredentialString) {
    fileName = path.join(__dirname, 'credentialTemplate.mustache');
  } else {
    throw new Error(`unrecognized meta template ${metaTemplateName}`);
  }
  let template = fs.readFileSync(fileName).toString();
  return template;
}

function getBucketName(metaTemplateName: string) {
  return `${metaTemplateName}s`;
}

function readableToString(readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', function (chunk) {
      data += chunk;
    });
    readable.on('end', function () {
      resolve(data);
    });
    readable.on('error', function (err) {
      reject(err);
    });
  });
}

async function expandPartial(key: string, value: string): Promise<any> {
  if (!value) {
    throw new Error(`No value provided for ${key}`);
  }
  if (key === IssuerString) {
    return issuerManager.get(value);
  } else if (key === AchievementString) {
    return achievementManager.get(value);
  } else {
    throw new Error(`unrecognized or unsupported partial: ${key}`);
  }
}

async function getExpandedPartialMap(opts: any, partials: any): Promise<any> {
  let expandedPartials = await Promise.all(partials.map(async function (p: string) {
    let t = await expandPartial(p, opts[PartialPrefix + p]);
    return { key: p, value: t };
  }));

  let partialMap = expandedPartials.reduce((map, val) => {
    let foo = val as KVP;
    map[foo.key] = JSON.stringify(foo.value);
    return map;
  }, {});
  return partialMap;
}

export async function render(template: string, opts: any, partials: any) {
  let partialMap = await getExpandedPartialMap(opts, partials);
  let rendered = mustache.render(template, opts, partialMap);
  let reformatted = JSON.stringify(JSON.parse(rendered), null, 2);
  return reformatted;
}

function getArgsFromParsedTemplate(parsedTemplate: any[], tokenFilter: string): any[] {
  return parsedTemplate
    .filter((t) => {
      return t[0] == tokenFilter;
    })
    .map((o) => o[1]);
}

export function getArgsFromTemplate(template: string, tokenFilter: string): any[] {
  let parsedTemplate = mustache.parse(template);
  return getArgsFromParsedTemplate(parsedTemplate, tokenFilter);
}

export class TemplateRenderer {
  templateName: string;
  template: string;
  parsedMetaTemplate: any[];
  constructor(templateName: string, template: string) {
    this.templateName = templateName;
    this.template = template;
    this.parsedMetaTemplate = mustache.parse(template);
  }

  name(): string {
    return this.templateName;
  }

  params(): any[string] {
    return getArgsFromParsedTemplate(this.parsedMetaTemplate, NameToken);
  }

  partials(): any[string] {
    return getArgsFromParsedTemplate(this.parsedMetaTemplate, PartialTemplateToken);
  }

  async render(opts): Promise<string> {
    return render(this.template, opts, this.partials());
  }
}

export class TemplateManager {
  metaTemplateName: string;
  bucketName: string;
  metaTemplate: string;
  parsedMetaTemplate: any[];
  s: Storage;
  mgr: TemplateRenderer;

  constructor(metaTemplateName: string) {
    this.metaTemplateName = metaTemplateName;
    this.bucketName = getBucketName(metaTemplateName);
    this.metaTemplate = getMetaTemplate(metaTemplateName);
    this.parsedMetaTemplate = mustache.parse(this.metaTemplate);
    this.mgr = new TemplateRenderer(metaTemplateName, this.metaTemplate);
  }

  setStorage(storage: Storage) {
    this.s = storage;
  }

  params(): any[string] {
    return this.mgr.params();
  }

  partials(): any[string] {
    return this.mgr.partials();
  }

  async init(templateName: string, opts: any): Promise<any> {
    const fileName = `${templateName}${JsonFileExtension}`;
    let reformatted = await this.mgr.render(opts);
    await this.s.selectBucket(this.bucketName);
    return this.s.addFileFromBuffer(Buffer.from(reformatted, 'utf8'), `${fileName}`)
      .then(() => {
        // resolve full path to inform user
        let config = this.s.getConfiguration();
        let fullPath = path.join(config['directory'], '..', this.bucketName, fileName);
        return {
          templateName: templateName,
          fileName: `${fullPath}`
        };
      });
  }

  async get(templateName: string): Promise<any> {
    await this.s.selectBucket(this.bucketName);
    const r = await this.s.getFileAsReadable(`${templateName}${JsonFileExtension}`);
    return readableToString(r).then((data) => {
      return JSON.parse(data);
    });
  }

  async list(): Promise<string[]> {
    await this.s.selectBucket(this.bucketName);
    const f = await this.s.listFiles();
    return f.map(g => g[0].slice(0, -JsonFileExtension.length));
  }

  async remove(templateName: string): Promise<any> {
    return this.s.selectBucket(this.bucketName)
      .then(t => {
        return this.s.removeFile(`${templateName}${JsonFileExtension}`);
      }).catch((err) => {
        console.error(err);
        throw err;
      });
  }
}

const issuerManager = new TemplateManager(IssuerString);
const achievementManager = new TemplateManager(AchievementString);
const credentialManager = new TemplateManager(CredentialString);

export function getTemplateManagers(storage: Storage) {
  issuerManager.setStorage(storage);
  achievementManager.setStorage(storage);
  credentialManager.setStorage(storage);
  return [issuerManager, achievementManager, credentialManager];
}
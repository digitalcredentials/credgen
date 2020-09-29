import { Storage } from '@tweedegolf/storage-abstraction';

import parse from "json-templates";
import { openStdin } from 'process';

const JsonFileExtension = '.json';
export const IssuerString = 'issuer';
export const AchievementString = 'achievement';
export const CredentialTemplateString = 'credentialTemplate';

// NOTE: these fields are not part of the VC standard, but are currently DCC convention
// TODO: add support for meta-templates/schemas, and set command line options as a function
const IssuerTemplate = {
  type: "Issuer",
  id: "{{id}}",
  image: "{{image}}",
  name: "{{issuerName}}",
  url: "{{url}}"
};

// NOTE: these fields are not part of the VC standard, but are currently DCC convention
// TODO: add support for meta-templates/schemas, and set command line options as a function
const AchievementTemplate = {
  type: "{{type}}",
  id: "{{id}}",
  name: "{{achievementName}}",
  description: "{{achievementDescription}}"
};

// TODO: make types and contexts configurable too
// TODO: this is actually a meta-template
const CredentialTemplate = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3c-ccg.github.io/vc-ed/contexts/v1/context.json"
  ],
  id: "{{id}}",
  issuanceDate: "{{issuanceDate}}",
  name: "{{vcName}}",
  type: [
    "VerifiableCredential",
    "Assertion"
  ],
  issuer: "{{issuer}}",
  credentialSubject: {
    type: "Person",
    id: "{{subjectId}}",
    name: "{{subjectName}}",
    hasAchieved: "{{achievement}}"
  }
}

function getProfileTemplate(profileType: string): string {
  let template = null;
  if (profileType === IssuerString) {
    template = IssuerTemplate;
  } else if (profileType === AchievementString) {
    template = AchievementTemplate;
  } else if (profileType === CredentialTemplateString) {
    template = CredentialTemplate;
  } else {
    throw new Error(`unrecognized profile type ${profileType}`);
  }
  return JSON.stringify(template);
}

function getBucketName(profileType: string) {
  return `${profileType}s`;
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


export class ProfileManager {
  profileType: string;
  bucketName: string;
  parsedTemplate: any;
  s: Storage;

  constructor(profileType: string) {
    this.profileType = profileType;
    this.bucketName = getBucketName(profileType);
    let templateAsString = getProfileTemplate(profileType);
    this.parsedTemplate = parse(templateAsString);
  }

  setStorage(storage: Storage) {
    this.s = storage;
  }

  params(): any[] {
    return this.parsedTemplate.parameters.map((o) => o['key']);
  }

  async init(profileName: string, opts: any): Promise<any> {
    const fileName = `${profileName}${JsonFileExtension}`;
    await this.s.selectBucket(this.bucketName);
    let parsed = this.parsedTemplate(opts);

    return this.s.addFileFromBuffer(Buffer.from(parsed, 'utf8'), `${fileName}`)
      .then(() => {
        return {
          profileName: profileName,
          fileName: fileName
        };
      });
  }

  async get(profileName: string): Promise<any> {
    await this.s.selectBucket(this.bucketName);
    const r = await this.s.getFileAsReadable(`${profileName}${JsonFileExtension}`);
    return readableToString(r).then((data) => {
      return JSON.parse(data);
    });
  }

  async list() : Promise<string[]> {
    const r = await this.s.selectBucket(this.bucketName);
    const f = await this.s.listFiles();
    return f.map(g => g[0].slice(0, -JsonFileExtension.length));
  }

  async remove(profileName: string): Promise<any> {
    return this.s.selectBucket(this.bucketName)
      .then(t => this.s.removeFile(`${profileName}${JsonFileExtension}`));
  }
}

const issuerProfileManager = new ProfileManager(IssuerString);
const achievementProfileManager = new ProfileManager(AchievementString);
const credentialTemplateManager = new ProfileManager(CredentialTemplateString);

export function getProfileManagers(storage: Storage) {
  issuerProfileManager.setStorage(storage);
  achievementProfileManager.setStorage(storage);
  credentialTemplateManager.setStorage(storage);
  return [issuerProfileManager, achievementProfileManager, credentialTemplateManager];
}
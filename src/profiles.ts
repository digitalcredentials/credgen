import { Storage } from '@tweedegolf/storage-abstraction';

const JsonFileExtension = '.json';
export const IssuerString = 'issuer';
export const AchievementString = 'achievement';
export const CredentialTemplateString = 'credentialTemplate';

const IssuerTemplate = {
  type: IssuerString,
  id: "",
  image: "",
  name: "",
  url: ""
};

const AchievementTemplate = {
  type: "",
  id: "",
  name: "",
  description: ""
};

// TODO: make types and contexts configurable too
const CredentialTemplate = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3c-ccg.github.io/vc-ed/contexts/v1/context.json"
  ],
  id: "",
  issuanceDate: "",
  name: "",
  description: "",
  type: [
    "VerifiableCredential",
    "Assertion"
  ],
  issuer: {},
  credentialSubject: {
    type: "Person",
    id: "",
    name: "",
    hasAchieved: {}
  }
}

function getProfileTemplate(profileType: string): any {
  if (profileType === IssuerString) {
    return IssuerTemplate;
  } else if (profileType === AchievementString) {
    return AchievementTemplate;
  } else if (profileType === CredentialTemplateString) {
    return CredentialTemplate;
  } else {
    throw new Error(`unrecognized profile type ${profileType}`);
  }
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
  template: any;
  s: Storage;

  constructor(profileType: string) {
    this.profileType = profileType;
    this.bucketName = getBucketName(profileType);
    this.template = getProfileTemplate(profileType);
  }

  setStorage(storage: Storage) {
    this.s = storage;
  }

  async init(profileName: string): Promise<any> {
    const fileName = `${profileName}${JsonFileExtension}`;
    await this.s.selectBucket(this.bucketName);
    return this.s.addFileFromBuffer(Buffer.from(JSON.stringify(this.template, null, 2), 'utf8'), `${fileName}`)
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
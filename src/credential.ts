import {encode} from 'node-base64-image';
const vc = require("./templates/vc.json");

// for now, it just provides utilities around json, but we'll add type info
export class Credential {
  credentialJson: any;

  constructor() {
    this.credentialJson = JSON.parse(JSON.stringify(vc));
  }

  addIssuerData(issuerData: any) {
    this.credentialJson.issuer = {...issuerData};
  }

  addAchievementData(achievementData: any) {
    this.credentialJson.credentialSubject.hasAchieved = {...achievementData};
  }

  addLearnerData(learnerDid: string, learnerName: string) {
    this.credentialJson.credentialSubject.id = learnerDid;
    this.credentialJson.credentialSubject.name = learnerName;
  }

  addCredentialInstanceData(credentialId: string, credentialName?: string, credentialDescription?: string, image?: string, issuanceDate?: string) {
    this.credentialJson.id = credentialId;

    if (credentialName) {
      this.credentialJson.name = credentialName!;
    }
    if (credentialDescription) {
      this.credentialJson.description = credentialDescription!;
    }

    /*
    if (image) {
      const options = {
        string: true,
      };
       
      const imageBuffer = await encode(image!, options);
      this.credentialJson.image = imageBuffer;
    }*/

    if (issuanceDate) {
      this.credentialJson.issuanceDate = issuanceDate;
    } else {
      this.credentialJson.issuanceDate = new Date().toISOString();
    }
  }

  toJson() {
    return this.credentialJson;
  }
}

export function newCredential() {
    return new Credential();
}

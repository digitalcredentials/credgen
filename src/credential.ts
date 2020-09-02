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

  addCredentialInstanceData(credentialId: string, image?: string, credentialName?: string, credentialDescription?: string, issuanceDate?: string) {
    this.credentialJson.id = credentialId;

    if (image) {
      this.credentialJson.image = image!;
    }
    if (credentialName) {
      this.credentialJson.name = credentialName!;
    }
    if (credentialDescription) {
      this.credentialJson.description = credentialDescription!;
    }

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

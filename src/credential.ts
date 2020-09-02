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
  
  addLearnerData(certificateId: string, learnerDid: string, learnerName: string, image?: string, issuanceDate?: string) {
    this.credentialJson.id = certificateId;
    this.credentialJson.credentialSubject.id = learnerDid;
    this.credentialJson.credentialSubject.name = learnerName;
    if (image) {
      this.credentialJson.displayProperties = image;
    }
  
    if (issuanceDate) {
      this.credentialJson.issuanceDate = issuanceDate;
    } else {
      this.credentialJson.issuanceDate = new Date().toISOString();
    }
  }
}

export function newCredential() {
    return new Credential();
}
